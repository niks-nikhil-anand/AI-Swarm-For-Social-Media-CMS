import type { NextRequest } from "next/server";
import { ApiError, ok, optionalString, readJson, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireApproval, type RouteContext } from "@/lib/social-api";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  const approval = await requireApproval(userId, id);
  if (approval.status !== "Pending") {
    throw new ApiError(409, "CONFLICT", "Only pending approvals can be approved.");
  }
  const body: Record<string, unknown> = await readJson<Record<string, unknown>>(request).catch(() => ({}));
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.approvalRequest.update({
      where: { id },
      data: {
        status: "Approved",
        decidedById: userId,
        decidedAt: new Date(),
        decisionNote: optionalString(body.decisionNote, "decisionNote"),
      },
    });
    await tx.contentDraft.update({
      where: { id: approval.variant.draftId },
      data: { status: "Approved" },
    });
    return row;
  });
  return ok(updated);
});
