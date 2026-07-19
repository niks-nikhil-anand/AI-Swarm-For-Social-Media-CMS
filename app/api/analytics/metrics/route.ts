import type { NextRequest } from "next/server";
import { ApiError, created, ok, parsePositiveInt, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { parseDateParam, parsePlatformParam, userPostWhere } from "@/lib/analytics-api";
import { prisma } from "@/lib/prisma";

function nullableInt(value: unknown, field: string): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a non-negative integer.`);
  }
  return parsed;
}

function nullableRate(value: unknown, field: string): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a non-negative number.`);
  }
  return parsed;
}

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const platform = parsePlatformParam(request.nextUrl.searchParams.get("platform"));
  const from = parseDateParam(request.nextUrl.searchParams.get("from"), "from");
  const to = parseDateParam(request.nextUrl.searchParams.get("to"), "to");
  const windowHours = request.nextUrl.searchParams.get("windowHours");

  const metrics = await prisma.contentMetric.findMany({
    where: {
      ...(windowHours ? { windowHours: parsePositiveInt(windowHours, "windowHours") } : {}),
      publishedPost: userPostWhere(userId, { campaignId, platform, from, to }),
    },
    orderBy: { collectedAt: "desc" },
    include: {
      publishedPost: {
        include: {
          account: true,
          schedule: { include: { variant: { include: { draft: true } } } },
        },
      },
    },
  });
  return ok(metrics);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const publishedPostId = requireString(body.publishedPostId, "publishedPostId");

  const post = await prisma.publishedPost.findFirst({
    where: { id: publishedPostId, schedule: { variant: { draft: { campaign: { userId } } } } },
  });
  if (!post) throw new ApiError(404, "NOT_FOUND", "Published post not found.");

  const collectedAt = body.collectedAt ? new Date(requireString(body.collectedAt, "collectedAt")) : undefined;
  if (collectedAt && Number.isNaN(collectedAt.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", "collectedAt must be a valid ISO date.");
  }

  const metric = await prisma.contentMetric.create({
    data: {
      publishedPostId,
      collectedAt,
      windowHours: parsePositiveInt(body.windowHours, "windowHours"),
      impressions: nullableInt(body.impressions, "impressions"),
      likes: nullableInt(body.likes, "likes"),
      comments: nullableInt(body.comments, "comments"),
      reposts: nullableInt(body.reposts, "reposts"),
      saves: nullableInt(body.saves, "saves"),
      profileVisits: nullableInt(body.profileVisits, "profileVisits"),
      linkClicks: nullableInt(body.linkClicks, "linkClicks"),
      leads: nullableInt(body.leads, "leads"),
      followersGained: nullableInt(body.followersGained, "followersGained"),
      engagementRate: nullableRate(body.engagementRate, "engagementRate"),
      conversionRate: nullableRate(body.conversionRate, "conversionRate"),
      raw: body.raw == null ? undefined : body.raw,
    },
  });
  return created(metric);
});
