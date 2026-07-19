import type { NextRequest } from "next/server";
import { noContent, ok, optionalString, parsePositiveInt, readJson, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { DEFAULT_POSTS_PER_DAY, DEFAULT_TIMEZONE } from "@/lib/social";
import { parseBoolean, requireCampaign, type RouteContext } from "@/lib/social-api";

export const GET = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireCampaign(userId, id);
  const campaign = await prisma.contentCampaign.findFirst({
    where: { id, userId },
    include: {
      sources: { orderBy: { createdAt: "desc" } },
      drafts: { orderBy: { createdAt: "desc" }, include: { _count: { select: { variants: true } } } },
    },
  });
  return ok(campaign);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireCampaign(userId, id);
  const body = await readJson<Record<string, unknown>>(request);
  const campaign = await prisma.contentCampaign.update({
    where: { id },
    data: {
      name: optionalString(body.name, "name"),
      description: optionalString(body.description, "description"),
      objective: optionalString(body.objective, "objective"),
      audience: optionalString(body.audience, "audience"),
      timezone: optionalString(body.timezone, "timezone") ?? DEFAULT_TIMEZONE,
      postsPerDay: body.postsPerDay == null ? undefined : parsePositiveInt(body.postsPerDay, "postsPerDay", DEFAULT_POSTS_PER_DAY),
      isPaused: body.isPaused == null ? undefined : parseBoolean(body.isPaused),
    },
  });
  return ok(campaign);
});

export const DELETE = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireCampaign(userId, id);
  await prisma.contentCampaign.update({ where: { id }, data: { archivedAt: new Date() } });
  return noContent();
});
