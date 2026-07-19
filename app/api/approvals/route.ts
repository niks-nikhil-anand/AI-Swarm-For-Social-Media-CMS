import type { NextRequest } from "next/server";
import { ApiError, created, ok, optionalString, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { MIN_APPROVAL_QUALITY_SCORE } from "@/lib/quality-gate";
import { parseDraftStatus, requireVariant } from "@/lib/social-api";

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const campaignId = request.nextUrl.searchParams.get("campaignId") ?? undefined;
  const approvals = await prisma.approvalRequest.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      variant: {
        draft: {
          campaign: {
            userId,
            ...(campaignId ? { id: campaignId } : {}),
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
    include: {
      requestedBy: { select: { id: true, email: true, name: true } },
      decidedBy: { select: { id: true, email: true, name: true } },
      variant: { include: { draft: { include: { campaign: true } }, factChecks: true, qualityScores: true } },
      schedules: true,
    },
  });
  return ok(approvals);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const variantId = requireString(body.variantId, "variantId");
  const variant = await requireVariant(userId, variantId);
  if ((variant.qualityScore ?? 0) < MIN_APPROVAL_QUALITY_SCORE) {
    throw new ApiError(
      409,
      "CONFLICT",
      `Variant must score at least ${MIN_APPROVAL_QUALITY_SCORE}/100 before approval. Current score: ${variant.qualityScore ?? "not scored"}.`
    );
  }
  const expiresAtRaw = optionalString(body.expiresAt, "expiresAt");
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : undefined;

  const approval = await prisma.$transaction(async (tx) => {
    const row = await tx.approvalRequest.create({
      data: {
        variantId,
        requestedById: userId,
        message: optionalString(body.message, "message"),
        expiresAt,
      },
    });
    await tx.contentDraft.update({
      where: { id: variant.draftId },
      data: { status: parseDraftStatus("NeedsApproval") },
    });
    return row;
  });

  return created(approval);
});
