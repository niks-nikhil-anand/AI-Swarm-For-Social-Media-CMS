import type { NextRequest } from "next/server";
import { ok, optionalString, readJson, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseBoolean, parsePlatform, requirePlatformAccount, type RouteContext } from "@/lib/social-api";

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  await requirePlatformAccount(userId, id);
  const body = await readJson<Record<string, unknown>>(request);
  const account = await prisma.platformAccount.update({
    where: { id },
    data: {
      platform: body.platform == null ? undefined : parsePlatform(body.platform),
      displayName: optionalString(body.displayName, "displayName"),
      handle: optionalString(body.handle, "handle"),
      isActive: body.isActive == null ? undefined : parseBoolean(body.isActive),
    },
  });
  return ok(account);
});
