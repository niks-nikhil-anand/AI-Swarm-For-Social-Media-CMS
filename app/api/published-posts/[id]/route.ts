import type { NextRequest } from "next/server";
import { ok, requireUserId, withApiHandler } from "@/lib/api";
import { requirePublishedPost, type RouteContext } from "@/lib/social-api";

export const GET = withApiHandler(async (_request: NextRequest, context) => {
  const userId = await requireUserId();
  const { id } = await (context as RouteContext).params;
  const post = await requirePublishedPost(userId, id);
  return ok(post);
});
