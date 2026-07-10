// Temporal workflow definition for a research project run.
// Workflows must be deterministic — all side effects live in activities.
//
// Pipeline (mirrors the roster's dependency graph):
//   lead (plan) → web (search + evidence) → data ∥ fact → writer → designer → synth

import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";

const { performSearch, runAgent, saveDeck, markProjectComplete } = proxyActivities<typeof activities>({
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
    }

    await markProjectComplete({ projectId, summary, wordCount });
    return { projectId, status: "completed", stagesRun };
  } catch (error) {
    await markProjectComplete({ projectId, failed: true });
    throw error;
  }
}
