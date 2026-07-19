import type { NextRequest } from "next/server";
import { ApiError, ok, optionalString, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireApproval, type RouteContext } from "@/lib/social-api";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  const approval = await requireApproval(userId, id);
  if (approval.status !== "Pending") {
    throw new ApiError(409, "CONFLICT", "Only pending approvals can request changes.");
  }
  const body = await readJson<Record<string, unknown>>(request);
  const note = requireString(body.decisionNote ?? body.message, "decisionNote");
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.approvalRequest.update({
      where: { id },
      data: {
        status: "ChangesRequested",
        decidedById: userId,
        decidedAt: new Date(),
        decisionNote: note,
      },
    });
    await tx.contentDraft.update({
      where: { id: approval.variant.draftId },
      data: {
        status: "ChangesRequested",
        notes: optionalString(body.draftNotes, "draftNotes") ?? approval.variant.draft.notes,
      },
    });
    return row;
  });
  return ok(updated);
});
