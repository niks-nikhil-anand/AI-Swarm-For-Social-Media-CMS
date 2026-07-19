import type { NextRequest } from "next/server";
import { ok, requireUserId, withApiHandler } from "@/lib/api";
import {
  averageNullable,
  getLatestMetricsForUserPosts,
  parseDateParam,
  parsePlatformParam,
  sumNullable,
} from "@/lib/analytics-api";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const platform = parsePlatformParam(request.nextUrl.searchParams.get("platform"));
  const from = parseDateParam(request.nextUrl.searchParams.get("from"), "from");
  const to = parseDateParam(request.nextUrl.searchParams.get("to"), "to");
  const postsWithMetrics = await getLatestMetricsForUserPosts(userId, { campaignId, platform, from, to });
  const latestMetrics = postsWithMetrics.map((item) => item.latestMetric);

  const approvalBacklog = await prisma.approvalRequest.count({
    where: {
      status: "Pending",
      variant: { draft: { campaign: { userId, ...(campaignId ? { id: campaignId } : {}) } } },
    },
  });
  const queuedSchedules = await prisma.publishingSchedule.count({
    where: {
      status: { in: ["Queued", "Scheduled", "Publishing"] },
      variant: { draft: { campaign: { userId, ...(campaignId ? { id: campaignId } : {}) } } },
    },
  });

  return ok({
    filters: { campaignId, platform, from, to },
    totals: {
      posts: postsWithMetrics.length,
      impressions: sumNullable(latestMetrics.map((metric) => metric?.impressions)),
      likes: sumNullable(latestMetrics.map((metric) => metric?.likes)),
      comments: sumNullable(latestMetrics.map((metric) => metric?.comments)),
      reposts: sumNullable(latestMetrics.map((metric) => metric?.reposts)),
      saves: sumNullable(latestMetrics.map((metric) => metric?.saves)),
      linkClicks: sumNullable(latestMetrics.map((metric) => metric?.linkClicks)),
      leads: sumNullable(latestMetrics.map((metric) => metric?.leads)),
      followersGained: sumNullable(latestMetrics.map((metric) => metric?.followersGained)),
    },
    averages: {
      engagementRate: averageNullable(latestMetrics.map((metric) => metric?.engagementRate)),
      conversionRate: averageNullable(latestMetrics.map((metric) => metric?.conversionRate)),
    },
    operations: {
      approvalBacklog,
      queuedSchedules,
    },
    topPosts: postsWithMetrics.slice(0, 10).map(({ post, latestMetric }) => ({
      id: post.id,
      platform: post.platform,
      publishedAt: post.publishedAt,
      title: post.schedule.variant.draft.title,
      body: post.schedule.variant.body,
      metric: latestMetric,
    })),
  });
});
