// Temporal workflow definition for a research project run.
// Workflows must be deterministic — all side effects live in activities.
//
// Pipeline (mirrors the roster's dependency graph):
//   lead (plan) → web (search + evidence) → data ∥ fact → writer → designer → synth

import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";
import { MIN_APPROVAL_QUALITY_SCORE } from "../lib/quality-gate";

const {
  performSearch,
  runAgent,
  saveDeck,
  saveDocument,
  markProjectComplete,
  loadSourceConfigurationActivity,
  runSearxngSearchActivity,
  normalizeTrendSignalsActivity,
  extractEvidenceAndDedupeSignalsActivity,
  scoreTrendSignalsActivity,
  saveTrendSignalsActivity,
  createDraftBriefActivity,
  generateLinkedInVariantActivity,
  generateXVariantActivity,
  generateVisualBriefActivity,
  factCheckVariantActivity,
  scoreContentQualityActivity,
  createApprovalRequestActivity,
  expireStaleApprovalsActivity,
  loadApprovedVariantsActivity,
  createPublishingScheduleActivity,
  publishToPostizActivity,
  syncPostizPublishStatusActivity,
  collectPostMetricsActivity,
  runLearningAnalysisActivity,
  listPublishableSchedulesActivity,
  listPublishedPostsForMetricsActivity,
  nextSlotIso,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  retry: {
    initialInterval: "2s",
    backoffCoefficient: 2,
    maximumInterval: "1 minute",
    maximumAttempts: 3,
  },
});

export interface WorkflowAgentRef {
  /** ProjectAgent.id (DB row). */
  id: string;
  /** Roster slug: lead/web/data/fact/writer/designer/synth or custom-*. */
  slug: string;
}

export interface ResearchWorkflowInput {
  projectId: string;
  goal: string;
  agents: WorkflowAgentRef[];
}

export interface ResearchWorkflowResult {
  projectId: string;
  status: "completed" | "failed";
  stagesRun: string[];
}

export interface SocialCampaignWorkflowInput {
  userId: string;
  campaignId?: string;
}

export interface DraftGenerationWorkflowInput extends SocialCampaignWorkflowInput {
  draftId: string;
  requestedById?: string;
}

export interface TrendResearchWorkflowResult {
  status: "completed";
  sourcesScanned: number;
  searchesRun: number;
  savedSignalIds: string[];
  createdDraftIds: string[];
}

export interface DraftGenerationWorkflowResult {
  status: "completed";
  draftId: string;
  variantIds: string[];
  approvalRequestIds: string[];
}

export interface PublishingSchedulerWorkflowResult {
  status: "completed";
  scheduleIds: string[];
  skippedVariantIds: string[];
}

export interface PublishingStatusWorkflowResult {
  status: "completed";
  checkedSchedules: number;
  statuses: Array<{ scheduleId: string; status: string }>;
}

export interface AnalyticsCollectionWorkflowResult {
  status: "completed";
  postsChecked: number;
  metricIds: string[];
  learningStatus: string;
}

function pick(agents: WorkflowAgentRef[], slug: string): WorkflowAgentRef | undefined {
  return agents.find((a) => a.slug === slug);
}

export async function researchProjectWorkflow(
  input: ResearchWorkflowInput
): Promise<ResearchWorkflowResult> {
  const { projectId, goal, agents } = input;
  const stagesRun: string[] = [];
  const outputs: Record<string, unknown> = {};

  const ctx = (keys: string[]) =>
    JSON.stringify(Object.fromEntries(keys.filter((k) => outputs[k]).map((k) => [k, outputs[k]])));

  try {
    // 1. Lead Researcher — decompose the goal into an execution plan.
    const lead = pick(agents, "lead");
    if (lead) {
      const plan = await runAgent({
        projectId, agentDbId: lead.id, slug: "lead",
        task: `Plan the research project. Objective: ${goal}`,
        context: "No prior context — this is the start of the run.",
      });
      outputs.plan = plan.output;
      stagesRun.push("lead");
    }

    // 2. Web Researcher — live SearXNG search, then evidence extraction.
    const web = pick(agents, "web");
    if (web) {
      const searchResults = await performSearch({ projectId, query: goal, agentId: web.id });
      const evidence = await runAgent({
        projectId, agentDbId: web.id, slug: "web",
        task: `Extract structured evidence relevant to: ${goal}`,
        context: JSON.stringify({ plan: outputs.plan, searchResults }),
      });
      outputs.evidence = evidence.output;
      stagesRun.push("web");
    }

    // 3. Data Analyst ∥ Fact-Checker — both consume the evidence.
    const data = pick(agents, "data");
    const fact = pick(agents, "fact");
    const [dataResult, factResult] = await Promise.all([
      data
        ? runAgent({
            projectId, agentDbId: data.id, slug: "data",
            task: `Produce the quantitative analysis for: ${goal}`,
            context: ctx(["plan", "evidence"]),
          })
        : Promise.resolve(null),
      fact
        ? runAgent({
            projectId, agentDbId: fact.id, slug: "fact",
            task: `Verify every claim gathered for: ${goal}`,
            context: ctx(["plan", "evidence"]),
          })
        : Promise.resolve(null),
    ]);
    if (dataResult) { outputs.analysis = dataResult.output; stagesRun.push("data"); }
    if (factResult) { outputs.verification = factResult.output; stagesRun.push("fact"); }

    // 4. Content Writer — verified findings → narrative.
    const writer = pick(agents, "writer");
    if (writer) {
      const draft = await runAgent({
        projectId, agentDbId: writer.id, slug: "writer",
        task: `Write the report for: ${goal}`,
        context: ctx(["plan", "verification", "analysis"]),
      });
      outputs.draft = draft.output;
      stagesRun.push("writer");
    }

    // 5. Presentation Designer — narrative → slide architecture.
    const designer = pick(agents, "designer");
    if (designer) {
      const deck = await runAgent({
        projectId, agentDbId: designer.id, slug: "designer",
        task: `Design the slide deck for: ${goal}`,
        context: ctx(["draft", "analysis"]),
      });
      outputs.deck = deck.output;
      stagesRun.push("designer");
      await saveDeck({ projectId, deck: deck.output });
    }

    // 6. Synthesis Agent — final quality gate and unified deliverable.
    const synth = pick(agents, "synth");
    let summary: string | undefined;
    let wordCount: number | undefined;
    if (synth) {
      const final = await runAgent({
        projectId, agentDbId: synth.id, slug: "synth",
        task: `Assemble the final deliverable for: ${goal}`,
        context: ctx(["plan", "verification", "analysis", "draft", "deck"]),
      });
      outputs.final = final.output;
      stagesRun.push("synth");
      summary = typeof final.output.executiveSummary === "string" ? final.output.executiveSummary : undefined;
      wordCount = typeof final.output.wordCount === "number" ? final.output.wordCount : undefined;
      await saveDocument({ projectId, final: final.output });
    }

    await markProjectComplete({ projectId, summary, wordCount });
    return { projectId, status: "completed", stagesRun };
  } catch (error) {
    await markProjectComplete({ projectId, failed: true });
    throw error;
  }
}

export async function dailyTrendResearchWorkflow(
  input: SocialCampaignWorkflowInput
): Promise<TrendResearchWorkflowResult> {
  const sources = await loadSourceConfigurationActivity(input);
  const allSignals: Array<Record<string, unknown>> = [];
  let searchesRun = 0;

  for (const source of sources) {
    const queries = Array.from(
      new Set([source.query, ...source.keywords].filter((query): query is string => Boolean(query)))
    ).slice(0, 3);

    for (const query of queries) {
      const results = await runSearxngSearchActivity({ sourceId: source.id, query });
      searchesRun += 1;
      const signals = await normalizeTrendSignalsActivity({
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        results,
      });
      allSignals.push(...signals);
    }
  }

  const dedupedSignals = await extractEvidenceAndDedupeSignalsActivity(allSignals);
  const scoredSignals = await scoreTrendSignalsActivity(dedupedSignals);
  const savedSignalIds = await saveTrendSignalsActivity({ signals: scoredSignals });
  const createdDraftIds: string[] = [];

  if (input.campaignId) {
    for (const trendSignalId of savedSignalIds.slice(0, 5)) {
      const draftId = await createDraftBriefActivity({ campaignId: input.campaignId, trendSignalId });
      createdDraftIds.push(draftId);
    }
  }

  return {
    status: "completed",
    sourcesScanned: sources.length,
    searchesRun,
    savedSignalIds,
    createdDraftIds,
  };
}

export async function draftGenerationWorkflow(
  input: DraftGenerationWorkflowInput
): Promise<DraftGenerationWorkflowResult> {
  const [linkedinVariantId, xVariantId] = await Promise.all([
    generateLinkedInVariantActivity({ draftId: input.draftId }),
    generateXVariantActivity({ draftId: input.draftId }),
  ]);
  await generateVisualBriefActivity({ draftId: input.draftId });

  const variantIds = [linkedinVariantId, xVariantId];
  const approvalRequestIds: string[] = [];

  for (const variantId of variantIds) {
    await factCheckVariantActivity({ variantId });
    const score = await scoreContentQualityActivity({ variantId });
    if (score >= MIN_APPROVAL_QUALITY_SCORE) {
      const approvalId = await createApprovalRequestActivity({
        variantId,
        requestedById: input.requestedById ?? input.userId,
      });
      approvalRequestIds.push(approvalId);
    }
  }

  return {
    status: "completed",
    draftId: input.draftId,
    variantIds,
    approvalRequestIds,
  };
}

export async function approvalReminderWorkflow(): Promise<{ status: "completed"; expiredApprovals: number }> {
  const expiredApprovals = await expireStaleApprovalsActivity();
  return { status: "completed", expiredApprovals };
}

export async function dailyPublishingSchedulerWorkflow(
  input: SocialCampaignWorkflowInput
): Promise<PublishingSchedulerWorkflowResult> {
  const approvedVariants = await loadApprovedVariantsActivity(input);
  const scheduleIds: string[] = [];
  const skippedVariantIds: string[] = [];

  for (let i = 0; i < Math.min(approvedVariants.length, 3); i++) {
    const variant = approvedVariants[i];
    const scheduledFor = await nextSlotIso(i, variant.timezone);
    const scheduleId = await createPublishingScheduleActivity({
      variantId: variant.id,
      approvalId: variant.approvalId,
      scheduledFor,
    });

    if (!scheduleId) {
      skippedVariantIds.push(variant.id);
      continue;
    }

    scheduleIds.push(scheduleId);
    await publishToPostizActivity({ scheduleId });
  }

  return { status: "completed", scheduleIds, skippedVariantIds };
}

export async function publishingStatusWorkflow(): Promise<PublishingStatusWorkflowResult> {
  const scheduleIds = await listPublishableSchedulesActivity();
  const statuses: Array<{ scheduleId: string; status: string }> = [];

  for (const scheduleId of scheduleIds) {
    const status = await syncPostizPublishStatusActivity({ scheduleId });
    statuses.push({ scheduleId, status: String(status) });
  }

  return { status: "completed", checkedSchedules: scheduleIds.length, statuses };
}

export async function analyticsCollectionWorkflow(
  input: SocialCampaignWorkflowInput
): Promise<AnalyticsCollectionWorkflowResult> {
  const postIds = await listPublishedPostsForMetricsActivity(input);
  const metricIds: string[] = [];
  const metricWindows = [1, 24, 168, 720];

  for (const publishedPostId of postIds) {
    for (const windowHours of metricWindows) {
      const metricId = await collectPostMetricsActivity({ publishedPostId, windowHours });
      metricIds.push(metricId);
    }
  }

  const learningStatus = await runLearningAnalysisActivity(input);
  return { status: "completed", postsChecked: postIds.length, metricIds, learningStatus };
}
