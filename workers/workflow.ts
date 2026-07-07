// Temporal workflow definition for a research project run.
// Workflows must be deterministic — all side effects live in activities.

import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";

const { performSearch, markProjectComplete } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  retry: {
    initialInterval: "1s",
    backoffCoefficient: 2,
    maximumInterval: "1 minute",
    maximumAttempts: 3,
  },
});

export interface ResearchWorkflowInput {
  projectId: string;
  goal: string;
  agentIds: string[];
}

export interface ResearchWorkflowResult {
  projectId: string;
  status: "completed" | "failed";
  resultCount: number;
}

export async function researchProjectWorkflow(
  input: ResearchWorkflowInput
): Promise<ResearchWorkflowResult> {
  const { projectId, goal, agentIds } = input;

  try {
    const results = await performSearch({
      projectId,
      query: goal,
      agentId: agentIds[0],
    });

    await markProjectComplete({ projectId });
    return { projectId, status: "completed", resultCount: results.length };
  } catch (error) {
    await markProjectComplete({ projectId, failed: true });
    throw error;
  }
}
