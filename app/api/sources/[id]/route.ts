import type { NextRequest } from "next/server";
import { noContent, ok, optionalString, readJson, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseBoolean, parseSignalSourceType, parseStringArray, requireCampaign, requireSource, type RouteContext } from "@/lib/social-api";

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireSource(userId, id);
  const body = await readJson<Record<string, unknown>>(request);
  const campaignId = optionalString(body.campaignId, "campaignId");
  if (campaignId) await requireCampaign(userId, campaignId);
  const source = await prisma.contentSource.update({
    where: { id },
    data: {
      campaignId,
      type: body.type == null ? undefined : parseSignalSourceType(body.type),
      name: optionalString(body.name, "name"),
      query: optionalString(body.query, "query"),
      url: optionalString(body.url, "url"),
      handle: optionalString(body.handle, "handle"),
      keywords: body.keywords == null ? undefined : parseStringArray(body.keywords, "keywords"),
      allowedDomains: body.allowedDomains == null ? undefined : parseStringArray(body.allowedDomains, "allowedDomains"),
      blockedDomains: body.blockedDomains == null ? undefined : parseStringArray(body.blockedDomains, "blockedDomains"),
      isActive: body.isActive == null ? undefined : parseBoolean(body.isActive),
    },
  });
  return ok(source);
});

export const DELETE = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireSource(userId, id);
  await prisma.contentSource.delete({ where: { id } });
  return noContent();
});
