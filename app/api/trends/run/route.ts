import type { NextRequest } from "next/server";
import { ok, optionalString, readJson, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createRunId } from "@/lib/hash";
import { requireCampaign } from "@/lib/social-api";

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const campaignId = optionalString(body.campaignId, "campaignId");
  if (campaignId) await requireCampaign(userId, campaignId);
  const runId = createRunId("trend");
  await prisma.systemHealthCheck.create({
    data: {
      userId,
      service: "trend-research-workflow",
      status: "Queued",
      message: campaignId ? `Queued trend research for campaign ${campaignId}` : "Queued trend research",
    },
  });
  return ok({ runId, status: "Queued", campaignId }, { status: 202 });
});
