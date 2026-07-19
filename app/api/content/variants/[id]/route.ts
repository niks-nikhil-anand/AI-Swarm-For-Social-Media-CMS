import type { NextRequest } from "next/server";
import { ok, optionalString, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashVariant, parseFactStatus, parseNullableInt, parsePlatform, parseStringArray, requireVariant, type RouteContext } from "@/lib/social-api";

export const GET = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireVariant(userId, id);
  const variant = await prisma.contentVariant.findUnique({
    where: { id },
    include: { draft: { include: { campaign: true } }, approvals: true, schedules: true, factChecks: true, qualityScores: true },
  });
  return ok(variant);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  const existing = await requireVariant(userId, id);
  const body = await readJson<Record<string, unknown>>(request);
  const platform = body.platform == null ? existing.platform : parsePlatform(body.platform);
  const nextBody = body.body == null ? existing.body : requireString(body.body, "body");
  const hook = body.hook == null ? existing.hook ?? undefined : optionalString(body.hook, "hook");
  const threadItems = body.threadItems == null ? existing.threadItems : parseStringArray(body.threadItems, "threadItems");
  const hashtags = body.hashtags == null ? existing.hashtags : parseStringArray(body.hashtags, "hashtags");
  const variant = await prisma.contentVariant.update({
    where: { id },
    data: {
      platform,
      hook,
      body: nextBody,
      threadItems,
      hashtags,
      visualBrief: optionalString(body.visualBrief, "visualBrief"),
      sourceReferences: body.sourceReferences == null ? undefined : parseStringArray(body.sourceReferences, "sourceReferences"),
      modelUsed: optionalString(body.modelUsed, "modelUsed"),
      tokensIn: parseNullableInt(body.tokensIn, "tokensIn"),
      tokensOut: parseNullableInt(body.tokensOut, "tokensOut"),
      characterCount: parseNullableInt(body.characterCount, "characterCount"),
      qualityScore: parseNullableInt(body.qualityScore, "qualityScore"),
      factStatus: parseFactStatus(body.factStatus),
      contentHash: hashVariant({ platform, body: nextBody, hook, threadItems, hashtags }),
    },
  });
  return ok(variant);
});
