// Research worker entry point. Run with: npm run worker
// Requires the Temporal server from docker-compose to be up.

import { Worker } from "@temporalio/worker";
import * as activities from "./activities";

async function main() {
  const worker = await Worker.create({
    namespace: process.env.TEMPORAL_NAMESPACE || "default",
    taskQueue: "research",
    workflowsPath: require.resolve("./workflow"),
    activities,
  });

  console.log("Research worker started on task queue: research");
  await worker.run();
}

main().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
