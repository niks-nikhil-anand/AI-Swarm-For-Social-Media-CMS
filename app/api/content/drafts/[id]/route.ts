import type { NextRequest } from "next/server";
import { ok, optionalString, readJson, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseDraftStatus, parseFactStatus, parseNullableInt, parsePlatforms, parseStringArray, requireDraft, type RouteContext } from "@/lib/social-api";

export const GET = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireDraft(userId, id);
  const draft = await prisma.contentDraft.findUnique({
    where: { id },
    include: { campaign: true, trendSignal: true, variants: { include: { approvals: true, schedules: true } } },
  });
  return ok(draft);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requireDraft(userId, id);
  const body = await readJson<Record<string, unknown>>(request);
  const draft = await prisma.contentDraft.update({
    where: { id },
    data: {
      title: optionalString(body.title, "title"),
      topic: optionalString(body.topic, "topic"),
      objective: optionalString(body.objective, "objective"),
      audience: optionalString(body.audience, "audience"),
      contentPillar: optionalString(body.contentPillar, "contentPillar"),
      primaryKeyword: optionalString(body.primaryKeyword, "primaryKeyword"),
      secondaryKeywords: body.secondaryKeywords == null ? undefined : parseStringArray(body.secondaryKeywords, "secondaryKeywords"),
      suggestedCta: optionalString(body.suggestedCta, "suggestedCta"),
      targetPlatforms: body.targetPlatforms == null ? undefined : parsePlatforms(body.targetPlatforms),
      status: parseDraftStatus(body.status),
      qualityScore: parseNullableInt(body.qualityScore, "qualityScore"),
      factStatus: parseFactStatus(body.factStatus),
      supportingUrls: body.supportingUrls == null ? undefined : parseStringArray(body.supportingUrls, "supportingUrls"),
      notes: optionalString(body.notes, "notes"),
    },
  });
  return ok(draft);
});
