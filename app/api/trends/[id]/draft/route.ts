import type { NextRequest } from "next/server";
import { created, optionalString, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parsePlatforms, requireCampaign, requireTrendSignal, type RouteContext } from "@/lib/social-api";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  const signal = await requireTrendSignal(userId, id);
  const body = await readJson<Record<string, unknown>>(request);
  const campaignId = requireString(body.campaignId, "campaignId");
  await requireCampaign(userId, campaignId);
  const draft = await prisma.contentDraft.create({
    data: {
      campaignId,
      trendSignalId: signal.id,
      title: optionalString(body.title, "title") ?? signal.title ?? signal.topic,
      topic: optionalString(body.topic, "topic") ?? signal.topic,
      objective: optionalString(body.objective, "objective"),
      audience: optionalString(body.audience, "audience") ?? signal.targetAudience,
      contentPillar: optionalString(body.contentPillar, "contentPillar"),
      primaryKeyword: optionalString(body.primaryKeyword, "primaryKeyword") ?? signal.primaryKeyword,
      secondaryKeywords: [],
      suggestedCta: optionalString(body.suggestedCta, "suggestedCta"),
      targetPlatforms: parsePlatforms(body.targetPlatforms),
      supportingUrls: signal.supportingUrls,
      notes: optionalString(body.notes, "notes"),
    },
  });
  return created(draft);
});
