import type { NextRequest } from "next/server";
import { ApiError, created, ok, optionalString, parsePositiveInt, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { parseDateParam } from "@/lib/analytics-api";
import { prisma } from "@/lib/prisma";

function parseStatus(value: unknown): string {
  const status = requireString(value, "status");
  if (!["Healthy", "Degraded", "Down", "Queued", "Running", "Completed", "Failed"].includes(status)) {
    throw new ApiError(400, "VALIDATION_ERROR", "status must be a known health status.");
  }
  return status;
}

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const service = request.nextUrl.searchParams.get("service") ?? undefined;
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const from = parseDateParam(request.nextUrl.searchParams.get("from"), "from");
  const to = parseDateParam(request.nextUrl.searchParams.get("to"), "to");
  const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), "limit", 50);

  const checks = await prisma.systemHealthCheck.findMany({
    where: {
      OR: [{ userId }, { userId: null }],
      ...(service ? { service } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            checkedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { checkedAt: "desc" },
    take: Math.min(limit, 200),
  });

  return ok(checks);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const latencyMs = body.latencyMs == null ? undefined : parsePositiveInt(body.latencyMs, "latencyMs");

  const check = await prisma.systemHealthCheck.create({
    data: {
      userId,
      service: requireString(body.service, "service"),
      status: parseStatus(body.status),
      latencyMs,
      message: optionalString(body.message, "message"),
    },
  });

  return created(check);
});
