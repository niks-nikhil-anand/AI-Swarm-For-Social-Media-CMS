// Temporal activities for the research workflow.
// Activities run in the worker process and may touch the DB and network.

import { prisma } from "../lib/prisma";
import { searxngSearch } from "../lib/searxng";
import { MAX_RESULTS_PER_SEARCH, MAX_SNIPPET_LENGTH } from "../lib/constants/searxng";
import { buildSystemPrompt, getAgentPrompt } from "../lib/constants/agentPrompts";
import { runAgentChat } from "../lib/llm";

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
