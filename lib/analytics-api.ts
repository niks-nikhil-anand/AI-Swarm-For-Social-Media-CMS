import { ApiError } from "./api";
import { prisma } from "./prisma";
import { SocialPlatform } from "../generated/prisma/enums";

export function parseDateParam(value: string | null, field: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a valid ISO date.`);
  }
  return date;
}

export function parsePlatformParam(value: string | null): SocialPlatform | undefined {
  if (!value) return undefined;
  if (!(value in SocialPlatform)) {
    throw new ApiError(400, "VALIDATION_ERROR", "platform must be LinkedIn or X.");
  }
  return SocialPlatform[value as keyof typeof SocialPlatform];
}

export function userPostWhere(userId: string, options?: {
  campaignId?: string | null;
  platform?: SocialPlatform;
  from?: Date;
  to?: Date;
}) {
  return {
    ...(options?.platform ? { platform: options.platform } : {}),
    ...(options?.from || options?.to
      ? {
          publishedAt: {
            ...(options.from ? { gte: options.from } : {}),
            ...(options.to ? { lte: options.to } : {}),
          },
        }
      : {}),
    schedule: {
      variant: {
        draft: {
          campaign: {
            userId,
            ...(options?.campaignId ? { id: options.campaignId } : {}),
          },
        },
      },
    },
  };
}

export function sumNullable(values: Array<number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function averageNullable(values: Array<number | null | undefined>): number | null {
  const realValues = values.filter((value): value is number => typeof value === "number");
  if (realValues.length === 0) return null;
  return realValues.reduce((total, value) => total + value, 0) / realValues.length;
}

export async function getLatestMetricsForUserPosts(userId: string, options?: {
  campaignId?: string | null;
  platform?: SocialPlatform;
  from?: Date;
  to?: Date;
}) {
  const posts = await prisma.publishedPost.findMany({
    where: userPostWhere(userId, options),
    include: {
      account: true,
      schedule: { include: { variant: { include: { draft: { include: { campaign: true } } } } } },
      metrics: { orderBy: [{ collectedAt: "desc" }] },
    },
    orderBy: { publishedAt: "desc" },
  });

  return posts.map((post) => ({
    post,
    latestMetric: post.metrics[0] ?? null,
  }));
}
