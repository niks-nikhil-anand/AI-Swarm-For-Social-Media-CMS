import type { NextRequest } from "next/server";
import { created, ok, optionalString, readJson, requireString, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseBoolean, parsePlatform } from "@/lib/social-api";

export const GET = withApiHandler(async () => {
  const userId = await requireUserId();
  const accounts = await prisma.platformAccount.findMany({
    where: { userId },
    orderBy: [{ platform: "asc" }, { displayName: "asc" }],
    include: { _count: { select: { schedules: true, posts: true } } },
  });
  return ok(accounts);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const body = await readJson<Record<string, unknown>>(request);
  const account = await prisma.platformAccount.create({
    data: {
      userId,
      platform: parsePlatform(body.platform),
      displayName: requireString(body.displayName, "displayName"),
      handle: optionalString(body.handle, "handle"),
      postizAccountId: requireString(body.postizAccountId, "postizAccountId"),
      isActive: parseBoolean(body.isActive, true),
      lastSyncedAt: new Date(),
    },
  });
  return created(account);
});
