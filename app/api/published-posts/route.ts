import type { NextRequest } from "next/server";
import { ok, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const platform = request.nextUrl.searchParams.get("platform") ?? undefined;
  const posts = await prisma.publishedPost.findMany({
    where: {
      ...(platform ? { platform: platform as never } : {}),
      schedule: { variant: { draft: { campaign: { userId } } } },
    },
    orderBy: { publishedAt: "desc" },
    include: { account: true, schedule: { include: { variant: { include: { draft: true } } } }, metrics: true },
  });
  return ok(posts);
});
