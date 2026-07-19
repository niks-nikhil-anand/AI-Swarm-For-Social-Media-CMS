import type { NextRequest } from "next/server";
import { ok, requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(async (request: NextRequest) => {
  const userId = await requireUserId();
  const campaignId = request.nextUrl.searchParams.get("campaignId") ?? undefined;
  const signals = await prisma.trendSignal.findMany({
    where: {
      OR: [
        { source: { userId, ...(campaignId ? { campaignId } : {}) } },
        { drafts: { some: { campaign: { userId, ...(campaignId ? { id: campaignId } : {}) } } } },
      ],
    },
    orderBy: [{ opportunityScore: "desc" }, { capturedAt: "desc" }],
    take: 100,
    include: { source: true, _count: { select: { drafts: true } } },
  });
  return ok(signals);
});
