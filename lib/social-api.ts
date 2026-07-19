import { ApiError, optionalStringArray } from "./api";
import { prisma } from "./prisma";
import { ContentDraftStatus, FactCheckStatus, SignalSourceType, SocialPlatform } from "../generated/prisma/enums";
import { createContentHash } from "./hash";

export type RouteContext = { params: Promise<{ id: string }> };

export function parseBoolean(value: unknown, fallback = false): boolean {
  if (value == null) return fallback;
  if (typeof value !== "boolean") throw new ApiError(400, "VALIDATION_ERROR", "Expected a boolean value.");
  return value;
}

export function parseNullableInt(value: unknown, field: string): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new ApiError(400, "VALIDATION_ERROR", `${field} must be an integer.`);
  return parsed;
}

export function parseSignalSourceType(value: unknown): SignalSourceType {
  if (typeof value !== "string" || !(value in SignalSourceType)) {
    throw new ApiError(400, "VALIDATION_ERROR", "type must be a valid signal source type.");
  }
  return SignalSourceType[value as keyof typeof SignalSourceType];
}

export function parseDraftStatus(value: unknown): ContentDraftStatus | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string" || !(value in ContentDraftStatus)) {
    throw new ApiError(400, "VALIDATION_ERROR", "status must be a valid draft status.");
  }
  return ContentDraftStatus[value as keyof typeof ContentDraftStatus];
}

export function parseFactStatus(value: unknown): FactCheckStatus | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string" || !(value in FactCheckStatus)) {
    throw new ApiError(400, "VALIDATION_ERROR", "factStatus must be a valid fact-check status.");
  }
  return FactCheckStatus[value as keyof typeof FactCheckStatus];
}

export function parsePlatform(value: unknown): SocialPlatform {
  if (typeof value !== "string" || !(value in SocialPlatform)) {
    throw new ApiError(400, "VALIDATION_ERROR", "platform must be LinkedIn or X.");
  }
  return SocialPlatform[value as keyof typeof SocialPlatform];
}

export function parsePlatforms(value: unknown): SocialPlatform[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new ApiError(400, "VALIDATION_ERROR", "targetPlatforms must be an array.");
  return value.map(parsePlatform);
}

export function parseStringArray(value: unknown, field: string): string[] {
  return optionalStringArray(value, field);
}

export async function requireCampaign(userId: string, campaignId: string) {
  const campaign = await prisma.contentCampaign.findFirst({ where: { id: campaignId, userId } });
  if (!campaign) throw new ApiError(404, "NOT_FOUND", "Campaign not found.");
  return campaign;
}

export async function requireSource(userId: string, sourceId: string) {
  const source = await prisma.contentSource.findFirst({ where: { id: sourceId, userId } });
  if (!source) throw new ApiError(404, "NOT_FOUND", "Source not found.");
  return source;
}

export async function requireTrendSignal(userId: string, signalId: string) {
  const signal = await prisma.trendSignal.findFirst({
    where: {
      id: signalId,
      OR: [
        { source: { userId } },
        { drafts: { some: { campaign: { userId } } } },
      ],
    },
  });
  if (!signal) throw new ApiError(404, "NOT_FOUND", "Trend signal not found.");
  return signal;
}

export async function requireDraft(userId: string, draftId: string) {
  const draft = await prisma.contentDraft.findFirst({ where: { id: draftId, campaign: { userId } } });
  if (!draft) throw new ApiError(404, "NOT_FOUND", "Draft not found.");
  return draft;
}

export async function requireVariant(userId: string, variantId: string) {
  const variant = await prisma.contentVariant.findFirst({
    where: { id: variantId, draft: { campaign: { userId } } },
    include: { draft: true },
  });
  if (!variant) throw new ApiError(404, "NOT_FOUND", "Variant not found.");
  return variant;
}

export async function requireApproval(userId: string, approvalId: string) {
  const approval = await prisma.approvalRequest.findFirst({
    where: { id: approvalId, variant: { draft: { campaign: { userId } } } },
    include: { variant: { include: { draft: true } } },
  });
  if (!approval) throw new ApiError(404, "NOT_FOUND", "Approval request not found.");
  return approval;
}

export async function requirePlatformAccount(userId: string, accountId: string) {
  const account = await prisma.platformAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new ApiError(404, "NOT_FOUND", "Platform account not found.");
  return account;
}

export async function requireSchedule(userId: string, scheduleId: string) {
  const schedule = await prisma.publishingSchedule.findFirst({
    where: { id: scheduleId, variant: { draft: { campaign: { userId } } } },
    include: { variant: { include: { draft: true } }, account: true, approval: true, post: true },
  });
  if (!schedule) throw new ApiError(404, "NOT_FOUND", "Schedule not found.");
  return schedule;
}

export async function requirePublishedPost(userId: string, postId: string) {
  const post = await prisma.publishedPost.findFirst({
    where: { id: postId, schedule: { variant: { draft: { campaign: { userId } } } } },
    include: { account: true, schedule: { include: { variant: { include: { draft: true } } } }, metrics: true },
  });
  if (!post) throw new ApiError(404, "NOT_FOUND", "Published post not found.");
  return post;
}

export function hashVariant(input: {
  platform: SocialPlatform;
  body: string;
  hook?: string;
  threadItems?: string[];
  hashtags?: string[];
}) {
  return createContentHash(input);
}
