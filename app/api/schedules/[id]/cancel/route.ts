import type { NextRequest } from "next/server";
import { ApiError, ok, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSchedule, type RouteContext } from "@/lib/social-api";

export const POST = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  const existing = await requireSchedule(userId, id);
  if (existing.status === "Published") {
    throw new ApiError(409, "CONFLICT", "Published schedules cannot be cancelled.");
  }
  const schedule = await prisma.publishingSchedule.update({
    where: { id },
    data: { status: "Cancelled" },
  });
  return ok(schedule);
});
