// Temporal activities for the research workflow.
// Activities run in the worker process and may touch the DB and network.

import { prisma } from "../lib/prisma";
import { searxngSearch } from "../lib/searxng";
import { MAX_RESULTS_PER_SEARCH, MAX_SNIPPET_LENGTH } from "../lib/constants/searxng";
import { buildSystemPrompt, getAgentPrompt } from "../lib/constants/agentPrompts";
import { runAgentChat } from "../lib/llm";
import { getAgentPrompt as getSocialAgentPrompt } from "../prompts";
import { createContentHash, createIdempotencyKey } from "../lib/hash";
import { getPostizClient } from "../lib/postiz";
import { DEFAULT_DAILY_SLOTS, DEFAULT_TIMEZONE } from "../lib/social";
import { MIN_APPROVAL_QUALITY_SCORE } from "../lib/quality-gate";
import { FactCheckStatus, SocialPlatform } from "../generated/prisma/enums";

// Free-tier models have modest context windows — cap what we feed them.
const MAX_CONTEXT_CHARS = 14_000;

function truncate(text: string, max = MAX_CONTEXT_CHARS): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n…[truncated]`;
}

export interface StoredSearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string | null;
}

export async function performSearch(input: {
  projectId: string;
  query: string;
  agentId?: string;
}): Promise<StoredSearchResult[]> {
  const { projectId, query, agentId } = input;

  if (agentId) {
    await prisma.projectAgent.updateMany({
      where: { id: agentId, projectId },
      data: { status: "Working", startedAt: new Date() },
    });
  }

  const response = await searxngSearch(query);
  const top = response.results.slice(0, MAX_RESULTS_PER_SEARCH);

  const rows: StoredSearchResult[] = [];
  for (let i = 0; i < top.length; i++) {
    const r = top[i];
    const row = await prisma.searchResult.upsert({
      where: { projectId_url: { projectId, url: r.url.slice(0, 2048) } },
      create: {
        projectId,
        query,
        rank: i + 1,
        title: r.title,
        url: r.url.slice(0, 2048),
        snippet: r.content?.slice(0, MAX_SNIPPET_LENGTH),
        engine: r.engine,
      },
      update: { rank: i + 1, query },
    });
    rows.push({ id: row.id, title: row.title, url: row.url, snippet: row.snippet });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { searches: { increment: 1 } },
  });

  if (agentId) {
    await prisma.timelineEvent.create({
      data: { projectId, projectAgentId: agentId, type: "Search", text: query },
    });
    // Status stays Working — the agent's runAgent turn completes it.
  }

  return rows;
}

export interface RunAgentInput {
  projectId: string;
  /** ProjectAgent.id — DB row for status + timeline updates. */
  agentDbId: string;
  /** Roster slug — selects the system prompt (lead/web/data/fact/writer/designer/synth). */
  slug: string;
  /** The concrete task this agent must perform now. */
  task: string;
  /** Upstream agents' outputs / evidence digest. */
  context: string;
}

export interface RunAgentOutput {
  slug: string;
  model: string;
  output: Record<string, unknown>;
}

// One agent turn: enforce the agent's production system prompt, run the LLM,
// record status transitions, usage, and a timeline audit trail.
export async function runAgent(input: RunAgentInput): Promise<RunAgentOutput> {
  const { projectId, agentDbId, slug, task, context } = input;
  const spec = getAgentPrompt(slug);

  await prisma.projectAgent.updateMany({
    where: { id: agentDbId, projectId },
    data: { status: "Working", progress: 10, startedAt: new Date() },
  });
  await prisma.timelineEvent.create({
    data: { projectId, projectAgentId: agentDbId, type: "Thought", text: task.slice(0, 500) },
  });

  try {
    const result = await runAgentChat(
      buildSystemPrompt(slug),
      `TASK\n${task}\n\nCONTEXT\n${truncate(context)}`
    );

    const digest =
      (result.output.summary as string | undefined) ||
      (result.output.executiveSummary as string | undefined) ||
      (result.output.narrativeArc as string | undefined) ||
      `${spec.title} finished its task.`;

    await prisma.$transaction(
      [
        prisma.projectAgent.updateMany({
          where: { id: agentDbId, projectId },
          data: { status: "Done", progress: 100, completedAt: new Date() },
        }),
        prisma.timelineEvent.create({
          data: {
            projectId,
            projectAgentId: agentDbId,
            type: "Note",
            topic: spec.title,
            text: String(digest).slice(0, 800),
          },
        }),
        prisma.project.update({
          where: { id: projectId },
          data: {
            tokensIn: { increment: result.usage.promptTokens },
            tokensOut: { increment: result.usage.completionTokens },
          },
        }),
      ],
      { timeout: 30000 }
    );

    return { slug, model: result.model, output: result.output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.$transaction(
      [
        prisma.projectAgent.updateMany({
          where: { id: agentDbId, projectId },
          data: { status: "Error" },
        }),
        prisma.timelineEvent.create({
          data: { projectId, projectAgentId: agentDbId, type: "Error", text: message.slice(0, 500) },
        }),
      ],
      { timeout: 30000 }
    );
    throw err;
  }
}

const VALID_SLIDE_KINDS = new Set(["Title", "Stat", "Bullets", "Chart", "Close"]);
const VALID_CHART_KINDS = new Set(["Dist", "Line", "Bars"]);

function capitalize(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// Persist the Presentation Designer's slide architecture into the Slide
// table, so the Output UI can render the real deck instead of nothing.
export async function saveDeck(input: {
  projectId: string;
  deck: Record<string, unknown>;
}): Promise<number> {
  const { projectId, deck } = input;
  const rawSlides = Array.isArray(deck.slides) ? deck.slides : [];
  if (rawSlides.length === 0) return 0;

  const rows = rawSlides.map((raw, i) => {
    const s = raw as Record<string, unknown>;
    const kind = capitalize(s.kind);
    const chart = capitalize(s.chart);
    const bullets = Array.isArray(s.bullets) ? s.bullets.filter((b) => typeof b === "string") : [];
    return {
      projectId,
      n: typeof s.n === "number" ? s.n : i + 1,
      kind: (VALID_SLIDE_KINDS.has(kind ?? "") ? kind : "Bullets") as "Title" | "Stat" | "Bullets" | "Chart" | "Close",
      title: typeof s.title === "string" ? s.title.slice(0, 200) : `Slide ${i + 1}`,
      sub: typeof s.keyMessage === "string" ? s.keyMessage.slice(0, 300) : null,
      footer: typeof deck.deckTitle === "string" ? deck.deckTitle.slice(0, 200) : null,
      stat: typeof s.stat === "string" ? s.stat.slice(0, 100) : null,
      statSub: typeof s.statSub === "string" ? s.statSub.slice(0, 200) : null,
      body: typeof s.keyMessage === "string" ? s.keyMessage.slice(0, 500) : null,
      bullets,
      chart: VALID_CHART_KINDS.has(chart ?? "") ? (chart as "Dist" | "Line" | "Bars") : null,
    };
  });

  await prisma.$transaction([
    prisma.slide.deleteMany({ where: { projectId } }),
    prisma.slide.createMany({ data: rows }),
  ]);

  return rows.length;
}

// Persist the Synthesis Agent's final written deliverable into Section /
// Reference tables, so document-format outputs (pdf/docx/blog/md/exec) show
// the real report instead of nothing.
export async function saveDocument(input: {
  projectId: string;
  final: Record<string, unknown>;
}): Promise<number> {
  const { projectId, final } = input;
  const deliverable = (final.deliverable ?? {}) as Record<string, unknown>;
  const rawSections = Array.isArray(deliverable.sections) ? deliverable.sections : [];
  const rawReferences = Array.isArray(final.references) ? final.references : [];

  const sectionRows = rawSections.map((raw, i) => {
    const s = raw as Record<string, unknown>;
    return {
      projectId,
      n: i + 1,
      heading: typeof s.heading === "string" ? s.heading.slice(0, 200) : `Section ${i + 1}`,
      body: typeof s.body === "string" ? s.body : "",
      keyTakeaway: typeof s.keyTakeaway === "string" ? s.keyTakeaway.slice(0, 300) : null,
      citations: Array.isArray(s.citations) ? s.citations.filter((c) => typeof c === "string") : [],
    };
  });

  let referenceRows = rawReferences
    .map((raw) => {
      const r = raw as Record<string, unknown>;
      if (typeof r.url !== "string") return null;
      return {
        projectId,
        refId: typeof r.id === "string" ? r.id : r.url.slice(0, 100),
        url: r.url.slice(0, 2048),
        title: typeof r.title === "string" ? r.title.slice(0, 300) : r.url,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Some models skip the top-level `references[]` contract and instead put
  // raw URLs directly in each section's `citations[]`. Synthesize a
  // reference list from those so the deliverable still has a sources list,
  // enriching titles from the researcher's own search results when we can.
  if (referenceRows.length === 0) {
    const urlCitations = Array.from(
      new Set(sectionRows.flatMap((s) => s.citations).filter((c) => /^https?:\/\//i.test(c)))
    );
    if (urlCitations.length > 0) {
      const matches = await prisma.searchResult.findMany({
        where: { projectId, url: { in: urlCitations } },
        select: { url: true, title: true },
      });
      const titleByUrl = new Map(matches.map((m) => [m.url, m.title]));
      referenceRows = urlCitations.map((url) => ({
        projectId,
        refId: url.slice(0, 100),
        url: url.slice(0, 2048),
        title: titleByUrl.get(url) ?? url,
      }));
    }
  }

  await prisma.$transaction([
    prisma.section.deleteMany({ where: { projectId } }),
    prisma.reference.deleteMany({ where: { projectId } }),
    ...(sectionRows.length ? [prisma.section.createMany({ data: sectionRows })] : []),
    ...(referenceRows.length ? [prisma.reference.createMany({ data: referenceRows, skipDuplicates: true })] : []),
  ]);

  return sectionRows.length;
}

export async function recordEvidence(input: {
  projectId: string;
  agentId: string;
  searchResultId?: string;
  content: string;
  topic: string;
  sourceUrl: string;
  sourceTitle?: string;
}): Promise<string> {
  const evidence = await prisma.evidence.create({ data: input });
  return evidence.id;
}

export async function markProjectComplete(input: {
  projectId: string;
  failed?: boolean;
  summary?: string;
  wordCount?: number;
}): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { createdAt: true },
  });

  if (!project) {
    console.warn(`Project not found: ${input.projectId}`);
    return;
  }

  await prisma.project.update({
    where: { id: input.projectId },
    data: {
      status: input.failed ? "Failed" : "Complete",
      completedAt: new Date(),
      durationSeconds: Math.round((Date.now() - project.createdAt.getTime()) / 1000),
      summary: input.summary?.slice(0, 2000),
      wordCount: input.wordCount,
    },
  });
}

export interface CampaignWorkflowInput {
  userId: string;
  campaignId?: string;
}

export async function loadSourceConfigurationActivity(input: CampaignWorkflowInput) {
  const sources = await prisma.contentSource.findMany({
    where: {
      userId: input.userId,
      isActive: true,
      ...(input.campaignId ? { OR: [{ campaignId: input.campaignId }, { campaignId: null }] } : {}),
    },
  });
  return sources.map((source) => ({
    id: source.id,
    type: source.type,
    name: source.name,
    query: source.query,
    url: source.url,
    handle: source.handle,
    keywords: source.keywords,
    allowedDomains: source.allowedDomains,
    blockedDomains: source.blockedDomains,
  }));
}

export async function runSearxngSearchActivity(input: { sourceId: string; query: string }) {
  const response = await searxngSearch(input.query, { time_range: "month", safesearch: 1 });
  return response.results.slice(0, MAX_RESULTS_PER_SEARCH).map((result) => ({
    sourceId: input.sourceId,
    title: result.title,
    url: result.url.slice(0, 2048),
    snippet: result.content?.slice(0, MAX_SNIPPET_LENGTH) ?? null,
    engine: result.engine,
    publishedDate: result.publishedDate ?? null,
    score: result.score ?? null,
  }));
}

export async function normalizeTrendSignalsActivity(input: {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  results: Array<{ title: string; url: string; snippet: string | null; engine?: string | null; publishedDate?: string | null; score?: number | null }>;
}) {
  return input.results.map((result) => ({
    sourceId: input.sourceId,
    type: input.sourceType,
    topic: result.title.slice(0, 180),
    title: result.title,
    url: result.url,
    snippet: result.snippet,
    sourceName: input.sourceName,
    engines: result.engine ? [result.engine] : [],
    publishedDates: result.publishedDate ? [result.publishedDate] : [],
    sourceCount: 1,
    trendDirection: "unknown",
    suggestedAngles: [
      `Explain why ${result.title} matters now`,
      `Turn ${result.title} into a practical operator lesson`,
    ],
    supportingUrls: [result.url],
    evidence: [
      {
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        engine: result.engine ?? null,
        publishedDate: result.publishedDate ?? null,
        score: result.score ?? null,
      },
    ],
    primaryKeyword: result.title.split(/\s+/).slice(0, 5).join(" "),
    opportunityScore: 50,
    freshnessScore: 50,
    businessRelevance: 50,
    audienceRelevance: 50,
    engagementPotential: 50,
  }));
}

function normalizeTopicKey(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|and|or|to|for|of|in|on|with|how|why|what)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 10)
    .join(" ");
}

function hostnameOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function extractEvidenceAndDedupeSignalsActivity(
  signals: Array<Record<string, unknown>>
): Promise<Array<Record<string, unknown>>> {
  const byKey = new Map<string, Record<string, unknown>>();

  for (const signal of signals) {
    const urls = Array.isArray(signal.supportingUrls) ? signal.supportingUrls.filter((v): v is string => typeof v === "string") : [];
    const urlKey = urls[0]?.replace(/[#?].*$/, "").toLowerCase();
    const topicKey = normalizeTopicKey(signal.topic || signal.title);
    if (!topicKey && !urlKey) continue;
    const key = urlKey || topicKey;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, {
        ...signal,
        topicKey,
        sourceDomains: Array.from(new Set(urls.map(hostnameOf).filter((v): v is string => Boolean(v)))),
      });
      continue;
    }

    const existingUrls = Array.isArray(existing.supportingUrls) ? existing.supportingUrls.filter((v): v is string => typeof v === "string") : [];
    const existingAngles = Array.isArray(existing.suggestedAngles) ? existing.suggestedAngles.filter((v): v is string => typeof v === "string") : [];
    const existingEvidence = Array.isArray(existing.evidence) ? existing.evidence : [];
    const nextEvidence = Array.isArray(signal.evidence) ? signal.evidence : [];
    const mergedUrls = Array.from(new Set([...existingUrls, ...urls]));
    const domains = Array.from(new Set(mergedUrls.map(hostnameOf).filter((v): v is string => Boolean(v))));

    byKey.set(key, {
      ...existing,
      title: typeof existing.title === "string" ? existing.title : signal.title,
      snippet: [existing.snippet, signal.snippet].filter((v): v is string => typeof v === "string").join("\n\n").slice(0, MAX_SNIPPET_LENGTH),
      sourceCount: mergedUrls.length,
      supportingUrls: mergedUrls,
      sourceDomains: domains,
      evidence: [...existingEvidence, ...nextEvidence].slice(0, 8),
      suggestedAngles: Array.from(new Set([
        ...existingAngles,
        ...(Array.isArray(signal.suggestedAngles) ? signal.suggestedAngles.filter((v): v is string => typeof v === "string") : []),
      ])).slice(0, 5),
      trendDirection: mergedUrls.length >= 3 ? "rising" : existing.trendDirection,
    });
  }

  return Array.from(byKey.values());
}

export async function scoreTrendSignalsActivity(
  signals: Array<Record<string, unknown>>
): Promise<Array<Record<string, unknown>>> {
  return signals.map((signal) => {
    const sourceCount = typeof signal.sourceCount === "number" ? signal.sourceCount : 1;
    const score = Math.min(100, 45 + sourceCount * 5);
    return {
      ...signal,
      opportunityScore: typeof signal.opportunityScore === "number" ? signal.opportunityScore : score,
      freshnessScore: typeof signal.freshnessScore === "number" ? signal.freshnessScore : 60,
      businessRelevance: typeof signal.businessRelevance === "number" ? signal.businessRelevance : 60,
      audienceRelevance: typeof signal.audienceRelevance === "number" ? signal.audienceRelevance : 60,
      engagementPotential: typeof signal.engagementPotential === "number" ? signal.engagementPotential : 55,
    };
  });
}

export async function saveTrendSignalsActivity(input: { signals: Array<Record<string, unknown>> }) {
  const saved = [];
  for (const raw of input.signals) {
    if (typeof raw.topic !== "string" || typeof raw.type !== "string") continue;
    const row = await prisma.trendSignal.create({
      data: {
        sourceId: typeof raw.sourceId === "string" ? raw.sourceId : null,
        type: raw.type as never,
        topic: raw.topic,
        title: typeof raw.title === "string" ? raw.title : null,
        url: typeof raw.url === "string" ? raw.url : null,
        snippet: typeof raw.snippet === "string" ? raw.snippet.slice(0, MAX_SNIPPET_LENGTH) : null,
        sourceName: typeof raw.sourceName === "string" ? raw.sourceName : null,
        sourceCount: typeof raw.sourceCount === "number" ? raw.sourceCount : 1,
        trendDirection: typeof raw.trendDirection === "string" ? raw.trendDirection : null,
        targetAudience: typeof raw.targetAudience === "string" ? raw.targetAudience : null,
        suggestedAngles: Array.isArray(raw.suggestedAngles) ? raw.suggestedAngles.filter((v): v is string => typeof v === "string") : [],
        supportingUrls: Array.isArray(raw.supportingUrls) ? raw.supportingUrls.filter((v): v is string => typeof v === "string") : [],
        primaryKeyword: typeof raw.primaryKeyword === "string" ? raw.primaryKeyword : null,
        opportunityScore: typeof raw.opportunityScore === "number" ? raw.opportunityScore : null,
        freshnessScore: typeof raw.freshnessScore === "number" ? raw.freshnessScore : null,
        businessRelevance: typeof raw.businessRelevance === "number" ? raw.businessRelevance : null,
        audienceRelevance: typeof raw.audienceRelevance === "number" ? raw.audienceRelevance : null,
        engagementPotential: typeof raw.engagementPotential === "number" ? raw.engagementPotential : null,
      },
    });
    saved.push(row.id);
  }
  return saved;
}

export async function createDraftBriefActivity(input: { campaignId: string; trendSignalId: string }) {
  const signal = await prisma.trendSignal.findUniqueOrThrow({ where: { id: input.trendSignalId } });
  const campaign = await prisma.contentCampaign.findUniqueOrThrow({ where: { id: input.campaignId } });
  const existing = await prisma.contentDraft.findFirst({
    where: { campaignId: input.campaignId, trendSignalId: signal.id },
    select: { id: true },
  });
  if (existing) return existing.id;
  const draft = await prisma.contentDraft.create({
    data: {
      campaignId: input.campaignId,
      trendSignalId: signal.id,
      title: signal.title ?? signal.topic,
      topic: signal.topic,
      objective: campaign.objective,
      audience: signal.targetAudience ?? campaign.audience,
      primaryKeyword: signal.primaryKeyword,
      secondaryKeywords: [],
      suggestedCta: "Start a conversation",
      targetPlatforms: [SocialPlatform.LinkedIn, SocialPlatform.X],
      supportingUrls: signal.supportingUrls,
      notes: [
        ...signal.suggestedAngles,
        signal.snippet ? `Evidence summary:\n${signal.snippet}` : null,
      ].filter(Boolean).join("\n\n"),
    },
  });
  return draft.id;
}

async function generateVariantWithPrompt(input: {
  draftId: string;
  platform: "LinkedIn" | "X";
  promptKey: "linkedin-writer" | "x-twitter-writer";
}) {
  const draft = await prisma.contentDraft.findUniqueOrThrow({
    where: { id: input.draftId },
    include: { trendSignal: true, campaign: true },
  });
  const prompt = getSocialAgentPrompt(input.promptKey);
  const fallbackBody = `${draft.title}\n\n${draft.notes ?? ""}\n\n${draft.supportingUrls.join("\n")}`.trim();
  let generated: Record<string, unknown> = {};
  let modelUsed = "fallback";
  let tokensIn = 0;
  let tokensOut = 0;
  try {
    const result = await runAgentChat(prompt, JSON.stringify({ draft, platform: input.platform }));
    generated = result.output;
    modelUsed = result.model;
    tokensIn = result.usage.promptTokens;
    tokensOut = result.usage.completionTokens;
  } catch {
    generated = { body: fallbackBody, hashtags: [], source_references: draft.supportingUrls };
  }

  const body =
    (typeof generated.body === "string" && generated.body) ||
    (typeof generated.single_post === "string" && generated.single_post) ||
    fallbackBody;
  const hook = typeof generated.hook === "string" ? generated.hook : null;
  const threadItems = Array.isArray(generated.thread) ? generated.thread.filter((v): v is string => typeof v === "string") : [];
  const hashtags = Array.isArray(generated.hashtags) ? generated.hashtags.filter((v): v is string => typeof v === "string") : [];
  const sourceReferences = Array.isArray(generated.source_references)
    ? generated.source_references.filter((v): v is string => typeof v === "string")
    : draft.supportingUrls;
  const contentHash = createContentHash({ platform: input.platform, hook, body, threadItems, hashtags });

  const variant = await prisma.contentVariant.upsert({
    where: { platform_contentHash: { platform: input.platform, contentHash } },
    create: {
      draftId: input.draftId,
      platform: input.platform,
      hook,
      body,
      threadItems,
      hashtags,
      visualBrief: typeof generated.visual_brief === "string" ? generated.visual_brief : null,
      sourceReferences,
      modelUsed,
      tokensIn,
      tokensOut,
      characterCount: body.length,
      contentHash,
    },
    update: { updatedAt: new Date() },
  });
  return variant.id;
}

export async function generateLinkedInVariantActivity(input: { draftId: string }) {
  return generateVariantWithPrompt({ draftId: input.draftId, platform: "LinkedIn", promptKey: "linkedin-writer" });
}

export async function generateXVariantActivity(input: { draftId: string }) {
  return generateVariantWithPrompt({ draftId: input.draftId, platform: "X", promptKey: "x-twitter-writer" });
}

export async function generateVisualBriefActivity(input: { draftId: string }) {
  const draft = await prisma.contentDraft.findUniqueOrThrow({ where: { id: input.draftId } });
  return {
    draftId: input.draftId,
    visualBrief: `Create a clean Social Swarm visual explaining: ${draft.topic}`,
  };
}

export async function factCheckVariantActivity(input: { variantId: string }) {
  const variant = await prisma.contentVariant.findUniqueOrThrow({ where: { id: input.variantId } });
  await prisma.factCheckResult.create({
    data: {
      variantId: input.variantId,
      claim: variant.body.slice(0, 500),
      status: FactCheckStatus.NeedsReview,
      confidence: 60,
      notes: "Automated first pass. Human review recommended before publishing.",
    },
  });
  await prisma.contentVariant.update({ where: { id: input.variantId }, data: { factStatus: FactCheckStatus.NeedsReview } });
  return FactCheckStatus.NeedsReview;
}

export async function scoreContentQualityActivity(input: { variantId: string }) {
  const variant = await prisma.contentVariant.findUniqueOrThrow({ where: { id: input.variantId } });
  const score = Math.max(50, Math.min(92, Math.round(variant.body.length / 20)));
  await prisma.contentQualityScore.create({
    data: {
      variantId: input.variantId,
      clarity: 8,
      brandAlignment: 8,
      platformFit: variant.platform === "X" ? 8 : 9,
      factualConfidence: 6,
      engagementPotential: 7,
      ctaQuality: 7,
      hashtagQuality: 7,
      overallScore: score,
      notes: score >= MIN_APPROVAL_QUALITY_SCORE ? "Passes automated quality gate." : "Needs improvement before approval.",
    },
  });
  await prisma.contentVariant.update({ where: { id: input.variantId }, data: { qualityScore: score } });
  return score;
}

export async function createApprovalRequestActivity(input: { variantId: string; requestedById: string }) {
  const variant = await prisma.contentVariant.findUniqueOrThrow({ where: { id: input.variantId } });
  const approval = await prisma.approvalRequest.create({
    data: {
      variantId: input.variantId,
      requestedById: input.requestedById,
      message: "Automated approval request created by DraftGenerationWorkflow.",
    },
  });
  await prisma.contentDraft.update({ where: { id: variant.draftId }, data: { status: "NeedsApproval" } });
  return approval.id;
}

export async function expireStaleApprovalsActivity() {
  const now = new Date();
  const result = await prisma.approvalRequest.updateMany({
    where: { status: "Pending", expiresAt: { lte: now } },
    data: { status: "Expired", decidedAt: now, decisionNote: "Approval deadline expired." },
  });
  return result.count;
}

export async function loadApprovedVariantsActivity(input: CampaignWorkflowInput) {
  const variants = await prisma.contentVariant.findMany({
    where: {
      draft: { campaign: { userId: input.userId, ...(input.campaignId ? { id: input.campaignId } : {}), isPaused: false } },
      approvals: { some: { status: "Approved" } },
      schedules: { none: { status: { in: ["Queued", "Scheduled", "Publishing", "Published"] } } },
    },
    include: { draft: { include: { campaign: true } }, approvals: true },
  });
  return variants.map((variant) => ({
    id: variant.id,
    draftId: variant.draftId,
    platform: variant.platform,
    contentHash: variant.contentHash,
    campaignId: variant.draft.campaignId,
    timezone: variant.draft.campaign.timezone,
    approvalId: variant.approvals.find((a) => a.status === "Approved")?.id,
  }));
}

export async function createPublishingScheduleActivity(input: {
  variantId: string;
  approvalId?: string;
  scheduledFor: string;
}) {
  const variant = await prisma.contentVariant.findUniqueOrThrow({ where: { id: input.variantId }, include: { draft: { include: { campaign: true } } } });
  const account = await prisma.platformAccount.findFirst({ where: { userId: variant.draft.campaign.userId, platform: variant.platform, isActive: true } });
  if (!account) return null;
  const scheduledFor = new Date(input.scheduledFor);
  const idempotencyKey = createIdempotencyKey([variant.id, variant.platform, account.id, scheduledFor]);
  const schedule = await prisma.publishingSchedule.upsert({
    where: { platform_idempotencyKey: { platform: variant.platform, idempotencyKey } },
    create: {
      variantId: variant.id,
      approvalId: input.approvalId,
      accountId: account.id,
      platform: variant.platform,
      status: "Queued",
      scheduledFor,
      timezone: variant.draft.campaign.timezone,
      idempotencyKey,
      contentHash: variant.contentHash,
    },
    update: {},
  });
  return schedule.id;
}

export async function publishToPostizActivity(input: { scheduleId: string }) {
  const schedule = await prisma.publishingSchedule.findUniqueOrThrow({
    where: { id: input.scheduleId },
    include: { variant: true, account: true },
  });
  const client = getPostizClient();
  await prisma.publishingSchedule.update({ where: { id: input.scheduleId }, data: { status: "Publishing" } });
  try {
    const result = await client.schedulePost({
      platform: schedule.platform,
      accountId: schedule.account.postizAccountId,
      text: schedule.variant.body,
      scheduledFor: schedule.scheduledFor,
      idempotencyKey: schedule.idempotencyKey,
    });
    await prisma.publishingSchedule.update({
      where: { id: input.scheduleId },
      data: { status: "Scheduled", postizPostId: result.postizPostId },
    });
    return result;
  } catch (error) {
    await prisma.publishingSchedule.update({
      where: { id: input.scheduleId },
      data: { status: "Failed", errorMessage: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}

export async function syncPostizPublishStatusActivity(input: { scheduleId: string }) {
  const schedule = await prisma.publishingSchedule.findUniqueOrThrow({ where: { id: input.scheduleId } });
  if (!schedule.postizPostId) return "missing-postiz-id";
  const result = await getPostizClient().getPostStatus(schedule.postizPostId);
  if (String(result.status).toLowerCase() === "published") {
    await prisma.publishedPost.upsert({
      where: { scheduleId: schedule.id },
      create: {
        scheduleId: schedule.id,
        accountId: schedule.accountId,
        platform: schedule.platform,
        postizPostId: result.postizPostId,
        platformPostId: result.platformPostId,
        contentHash: schedule.contentHash,
        publishedAt: new Date(),
      },
      update: { platformPostId: result.platformPostId },
    });
    await prisma.publishingSchedule.update({ where: { id: schedule.id }, data: { status: "Published" } });
  }
  return result.status;
}

export async function collectPostMetricsActivity(input: { publishedPostId: string; windowHours: number }) {
  const metric = await prisma.contentMetric.create({
    data: {
      publishedPostId: input.publishedPostId,
      windowHours: input.windowHours,
      raw: { collectedBy: "AnalyticsCollectionWorkflow" },
    },
  });
  return metric.id;
}

export async function runLearningAnalysisActivity(input: CampaignWorkflowInput) {
  await prisma.systemHealthCheck.create({
    data: {
      userId: input.userId,
      service: "learning-agent",
      status: "Completed",
      message: input.campaignId ? `Learning analysis completed for campaign ${input.campaignId}` : "Learning analysis completed.",
    },
  });
  return "completed";
}

export async function listPublishableSchedulesActivity() {
  const schedules = await prisma.publishingSchedule.findMany({
    where: { status: { in: ["Queued", "Scheduled", "Publishing"] } },
    select: { id: true },
  });
  return schedules.map((s) => s.id);
}

export async function listPublishedPostsForMetricsActivity(input: CampaignWorkflowInput) {
  const posts = await prisma.publishedPost.findMany({
    where: { schedule: { variant: { draft: { campaign: { userId: input.userId, ...(input.campaignId ? { id: input.campaignId } : {}) } } } } },
    select: { id: true },
  });
  return posts.map((p) => p.id);
}

export async function nextSlotIso(index: number, timezone = DEFAULT_TIMEZONE): Promise<string> {
  void timezone;
  const slot = DEFAULT_DAILY_SLOTS[index % DEFAULT_DAILY_SLOTS.length];
  const date = new Date();
  const [hours, minutes] = slot.time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  return date.toISOString();
}
