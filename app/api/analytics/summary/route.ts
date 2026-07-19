import type { NextRequest } from "next/server";
import { ok, requireUserId, withApiHandler } from "@/lib/api";
import {
  averageNullable,
  getLatestMetricsForUserPosts,
  parseDateParam,
  parsePlatformParam,
  sumNullable,
} from "@/lib/analytics-api";

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const platform = parsePlatformParam(request.nextUrl.searchParams.get("platform"));
  const from = parseDateParam(request.nextUrl.searchParams.get("from"), "from");
  const to = parseDateParam(request.nextUrl.searchParams.get("to"), "to");
  const postsWithMetrics = await getLatestMetricsForUserPosts(userId, { campaignId, platform, from, to });

  const byPlatform = postsWithMetrics.reduce<Record<string, {
    posts: number;
    impressions: number;
    likes: number;
    comments: number;
    reposts: number;
    linkClicks: number;
    engagementRates: number[];
  }>>((summary, { post, latestMetric }) => {
    const row = summary[post.platform] ?? {
      posts: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      reposts: 0,
      linkClicks: 0,
      engagementRates: [],
    };
    row.posts += 1;
    row.impressions += latestMetric?.impressions ?? 0;
    row.likes += latestMetric?.likes ?? 0;
    row.comments += latestMetric?.comments ?? 0;
    row.reposts += latestMetric?.reposts ?? 0;
    row.linkClicks += latestMetric?.linkClicks ?? 0;
    if (typeof latestMetric?.engagementRate === "number") row.engagementRates.push(latestMetric.engagementRate);
    summary[post.platform] = row;
    return summary;
  }, {});

  const latestMetrics = postsWithMetrics.map((item) => item.latestMetric);
  return ok({
    filters: { campaignId, platform, from, to },
    totals: {
      posts: postsWithMetrics.length,
      impressions: sumNullable(latestMetrics.map((metric) => metric?.impressions)),
      engagements: sumNullable(latestMetrics.map((metric) => metric?.likes))
        + sumNullable(latestMetrics.map((metric) => metric?.comments))
        + sumNullable(latestMetrics.map((metric) => metric?.reposts)),
      linkClicks: sumNullable(latestMetrics.map((metric) => metric?.linkClicks)),
      leads: sumNullable(latestMetrics.map((metric) => metric?.leads)),
      averageEngagementRate: averageNullable(latestMetrics.map((metric) => metric?.engagementRate)),
      averageConversionRate: averageNullable(latestMetrics.map((metric) => metric?.conversionRate)),
    },
    byPlatform: Object.fromEntries(
      Object.entries(byPlatform).map(([key, value]) => [
        key,
        {
          posts: value.posts,
          impressions: value.impressions,
          likes: value.likes,
          comments: value.comments,
          reposts: value.reposts,
          linkClicks: value.linkClicks,
          averageEngagementRate: averageNullable(value.engagementRates),
        },
      ])
    ),
  });
});
