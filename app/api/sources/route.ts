import type { NextRequest } from "next/server";
import { created, ok, optionalString, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseBoolean, parseSignalSourceType, parseStringArray, requireCampaign } from "@/lib/social-api";

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const campaignId = request.nextUrl.searchParams.get("campaignId") ?? undefined;
  const sources = await prisma.contentSource.findMany({
    where: { userId, ...(campaignId ? { campaignId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { signals: true } } },
  });
  return ok(sources);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const campaignId = optionalString(body.campaignId, "campaignId");
  if (campaignId) await requireCampaign(userId, campaignId);
  const source = await prisma.contentSource.create({
    data: {
      userId,
      campaignId,
      type: parseSignalSourceType(body.type),
      name: requireString(body.name, "name"),
      query: optionalString(body.query, "query"),
      url: optionalString(body.url, "url"),
      handle: optionalString(body.handle, "handle"),
      keywords: parseStringArray(body.keywords, "keywords"),
      allowedDomains: parseStringArray(body.allowedDomains, "allowedDomains"),
      blockedDomains: parseStringArray(body.blockedDomains, "blockedDomains"),
      isActive: parseBoolean(body.isActive, true),
    },
  });
  return created(source);
});
