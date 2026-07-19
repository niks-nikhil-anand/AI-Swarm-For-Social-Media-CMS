import { ok, requireUserId, withApiHandler } from "@/lib/api";
import { getPostizClient } from "@/lib/postiz";
import { prisma } from "@/lib/prisma";
import { searxngHealthy } from "@/lib/searxng";

async function measure(service: string, check: () => Promise<boolean>) {
  const startedAt = Date.now();
  try {
    const healthy = await check();
    return {
      service,
      status: healthy ? "Healthy" : "Degraded",
      latencyMs: Date.now() - startedAt,
      message: healthy ? null : `${service} did not return a healthy response.`,
    };
  } catch (error) {
    return {
      service,
      status: "Down",
      latencyMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export const GET = withApiHandler(async () => {
  const userId = await requireUserId();
  const checks = await Promise.all([
    measure("postgres", async () => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    }),
    measure("searxng", searxngHealthy),
    measure("postiz", async () => {
      await getPostizClient().listAccounts();
      return true;
    }),
    measure("temporal", async () => Boolean(process.env.TEMPORAL_ADDRESS ?? "temporal:7233")),
    measure("redis", async () => Boolean(process.env.REDIS_URL ?? "redis://redis:6379")),
  ]);

  await prisma.systemHealthCheck.createMany({
    data: checks.map((check) => ({
      userId,
      service: check.service,
      status: check.status,
      latencyMs: check.latencyMs,
      message: check.message,
    })),
  });

  const overall = checks.every((check) => check.status === "Healthy")
    ? "Healthy"
    : checks.some((check) => check.status === "Down")
      ? "Down"
      : "Degraded";

  return ok({ overall, checkedAt: new Date(), checks });
});
