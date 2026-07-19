import type { NextRequest } from "next/server";
import { created, ok, optionalString, parsePositiveInt, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { DEFAULT_POSTS_PER_DAY, DEFAULT_TIMEZONE } from "@/lib/social";
import { parseBoolean } from "@/lib/social-api";

export const GET = withApiHandler(async () => {
  const userId = await requireUserId();
  const campaigns = await prisma.contentCampaign.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { drafts: true, sources: true } } },
  });
  return ok(campaigns);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const campaign = await prisma.contentCampaign.create({
    data: {
      userId,
      name: requireString(body.name, "name"),
      description: optionalString(body.description, "description"),
      objective: optionalString(body.objective, "objective"),
      audience: optionalString(body.audience, "audience"),
      timezone: optionalString(body.timezone, "timezone") ?? DEFAULT_TIMEZONE,
      postsPerDay: parsePositiveInt(body.postsPerDay, "postsPerDay", DEFAULT_POSTS_PER_DAY),
      isPaused: parseBoolean(body.isPaused, false),
    },
  });
  return created(campaign);
});
