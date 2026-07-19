import type { NextRequest } from "next/server";
import { ApiError, ok, optionalString, readJson, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSchedule, type RouteContext } from "@/lib/social-api";

export const GET = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  const schedule = await requireSchedule(userId, id);
  return ok(schedule);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  const existing = await requireSchedule(userId, id);
  if (!["Queued", "Scheduled", "Failed"].includes(existing.status)) {
    throw new ApiError(409, "CONFLICT", "Only queued, scheduled, or failed schedules can be changed.");
  }
  const body = await readJson<Record<string, unknown>>(request);
  const scheduledForRaw = optionalString(body.scheduledFor, "scheduledFor");
  const scheduledFor = scheduledForRaw ? new Date(scheduledForRaw) : undefined;
  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", "scheduledFor must be a valid ISO date.");
  }
  const schedule = await prisma.publishingSchedule.update({
    where: { id },
    data: {
      scheduledFor,
      timezone: optionalString(body.timezone, "timezone"),
      errorMessage: optionalString(body.errorMessage, "errorMessage"),
    },
  });
  return ok(schedule);
});
