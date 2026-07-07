// Temporal client singleton for starting/inspecting research workflows.
// Server-side only — never import from client components.

import { Client, Connection } from "@temporalio/client";

declare global {
  var __temporalClient: Client | undefined;
}

export const RESEARCH_TASK_QUEUE = "research";

export async function getTemporalClient(): Promise<Client> {
  if (globalThis.__temporalClient) return globalThis.__temporalClient;

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
  });
  const client = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || "default",
  });

  if (process.env.NODE_ENV !== "production") globalThis.__temporalClient = client;
  return client;
}

export async function startResearchWorkflow(input: {
  projectId: string;
  goal: string;
  agents: { id: string; slug: string }[];
}): Promise<string> {
  const client = await getTemporalClient();
  const handle = await client.workflow.start("researchProjectWorkflow", {
    taskQueue: RESEARCH_TASK_QUEUE,
    workflowId: `research-${input.projectId}`,
    args: [input],
  });
  return handle.workflowId;
}

export type WorkflowStatusName =
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "TERMINATED"
  | "TIMED_OUT"
  | "CONTINUED_AS_NEW"
  | "UNKNOWN";

export async function getWorkflowStatus(workflowId: string): Promise<WorkflowStatusName> {
  const client = await getTemporalClient();
  try {
    const handle = client.workflow.getHandle(workflowId);
    const description = await handle.describe();
    return (description.status.name?.toUpperCase() as WorkflowStatusName) ?? "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}
