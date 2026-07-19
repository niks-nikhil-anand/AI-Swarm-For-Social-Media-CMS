import type { NextRequest } from "next/server";
import { ApiError, created, ok, optionalString, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createIdempotencyKey } from "@/lib/hash";
import { DEFAULT_TIMEZONE } from "@/lib/social";
import { parsePlatform, requirePlatformAccount, requireVariant } from "@/lib/social-api";

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const schedules = await prisma.publishingSchedule.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      variant: { draft: { campaign: { userId } } },
    },
    orderBy: { scheduledFor: "asc" },
    include: { variant: { include: { draft: true } }, account: true, approval: true, post: true },
  });
  return ok(schedules);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const variantId = requireString(body.variantId, "variantId");
  const accountId = requireString(body.accountId, "accountId");
  const scheduledForRaw = requireString(body.scheduledFor, "scheduledFor");
  const scheduledFor = new Date(scheduledForRaw);
  if (Number.isNaN(scheduledFor.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", "scheduledFor must be a valid ISO date.");
  }

  const variant = await requireVariant(userId, variantId);
  const account = await requirePlatformAccount(userId, accountId);
  const platform = body.platform == null ? variant.platform : parsePlatform(body.platform);
  if (platform !== variant.platform || platform !== account.platform) {
    throw new ApiError(400, "VALIDATION_ERROR", "Schedule platform must match variant and account platform.");
  }

  const campaign = await prisma.contentCampaign.findFirstOrThrow({ where: { id: variant.draft.campaignId } });
  if (campaign.isPaused) throw new ApiError(409, "CONFLICT", "Campaign publishing is paused.");

  const approval = await prisma.approvalRequest.findFirst({
    where: { variantId, status: "Approved" },
    orderBy: { decidedAt: "desc" },
  });
  if (!approval) throw new ApiError(409, "CONFLICT", "Variant must be approved before scheduling.");

  const idempotencyKey = optionalString(body.idempotencyKey, "idempotencyKey")
    ?? createIdempotencyKey([variantId, platform, accountId, scheduledFor]);

  const schedule = await prisma.publishingSchedule.create({
    data: {
      variantId,
      approvalId: approval.id,
      accountId,
      platform,
      status: "Queued",
      scheduledFor,
      timezone: optionalString(body.timezone, "timezone") ?? campaign.timezone ?? DEFAULT_TIMEZONE,
      idempotencyKey,
      contentHash: variant.contentHash,
    },
  });
  await prisma.contentDraft.update({ where: { id: variant.draftId }, data: { status: "Scheduled" } });
  return created(schedule);
});
