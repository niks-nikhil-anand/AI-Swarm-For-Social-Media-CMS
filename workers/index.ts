// Research worker entry point. Run with: npm run worker
// Requires the Temporal server from docker-compose to be up.

// Load .env before anything touches process.env (tsx doesn't auto-load it
// the way `next dev` does — without this, Prisma gets no DATABASE_URL).
import "dotenv/config";

import { Worker, NativeConnection } from "@temporalio/worker";
import * as activities from "./activities";

async function main() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || "localhost:7233";
  const namespace = process.env.TEMPORAL_NAMESPACE || "default";

  let connection;
  let retries = 0;
  const maxRetries = 10;

  while (retries < maxRetries) {
    try {
      connection = await NativeConnection.connect({
        address: temporalAddress,
      });

      const worker = await Worker.create({
        connection,
        namespace,
        taskQueue: "research",
        workflowsPath: require.resolve("./workflow"),
        activities,
      });

      console.log(`Research worker started on task queue: research (Temporal: ${temporalAddress})`);
      await worker.run();
      return;
    } catch (error) {
      retries++;
      const waitTime = Math.min(1000 * retries, 5000);
      if (retries >= maxRetries) {
        throw new Error(
          `Failed to connect to Temporal after ${maxRetries} retries: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      console.error(`Connection attempt ${retries}/${maxRetries} failed, retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  console.log("Research worker started on task queue: research");
  await worker.run();
}

main().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
