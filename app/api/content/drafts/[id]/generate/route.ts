import type { NextRequest } from "next/server";
import { ok, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createRunId } from "@/lib/hash";
import { requireDraft, type RouteContext } from "@/lib/social-api";

export const POST = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireDraft(userId, id);
  const runId = createRunId("draft");
  await prisma.contentDraft.update({ where: { id }, data: { status: "InReview" } });
  await prisma.systemHealthCheck.create({
    data: {
      userId,
      service: "draft-generation-workflow",
      status: "Queued",
      message: `Queued draft generation for ${id}`,
    },
  });
  return ok({ runId, status: "Queued", draftId: id }, { status: 202 });
});
