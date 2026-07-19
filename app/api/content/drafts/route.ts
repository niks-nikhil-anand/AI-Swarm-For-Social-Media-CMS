import type { NextRequest } from "next/server";
import { created, ok, optionalString, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseDraftStatus, parseFactStatus, parseNullableInt, parsePlatforms, parseStringArray, requireCampaign } from "@/lib/social-api";

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const campaignId = request.nextUrl.searchParams.get("campaignId") ?? undefined;
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const drafts = await prisma.contentDraft.findMany({
    where: {
      campaign: { userId, ...(campaignId ? { id: campaignId } : {}) },
      ...(status ? { status: parseDraftStatus(status) } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { campaign: true, trendSignal: true, variants: true },
  });
  return ok(drafts);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const campaignId = requireString(body.campaignId, "campaignId");
  await requireCampaign(userId, campaignId);
  const draft = await prisma.contentDraft.create({
    data: {
      campaignId,
      title: requireString(body.title, "title"),
      topic: requireString(body.topic, "topic"),
      objective: optionalString(body.objective, "objective"),
      audience: optionalString(body.audience, "audience"),
      contentPillar: optionalString(body.contentPillar, "contentPillar"),
      primaryKeyword: optionalString(body.primaryKeyword, "primaryKeyword"),
      secondaryKeywords: parseStringArray(body.secondaryKeywords, "secondaryKeywords"),
      suggestedCta: optionalString(body.suggestedCta, "suggestedCta"),
      targetPlatforms: parsePlatforms(body.targetPlatforms),
      status: parseDraftStatus(body.status),
      qualityScore: parseNullableInt(body.qualityScore, "qualityScore"),
      factStatus: parseFactStatus(body.factStatus),
      supportingUrls: parseStringArray(body.supportingUrls, "supportingUrls"),
      notes: optionalString(body.notes, "notes"),
    },
  });
  return created(draft);
});
