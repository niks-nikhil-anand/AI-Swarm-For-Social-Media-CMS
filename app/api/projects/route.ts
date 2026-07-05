import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUserId } from "../../../lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { agents: true, sources: true } } },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      title: p.title,
      goal: p.goal,
      format: p.format,
      status: p.status,
      cost: p.cost,
      tokensIn: p.tokensIn,
      tokensOut: p.tokensOut,
      searches: p.searches,
      durationSeconds: p.durationSeconds,
      wordCount: p.wordCount,
      summary: p.summary,
      createdAt: p.createdAt.toISOString(),
      agentsCount: p._count.agents,
      sourcesCount: p._count.sources,
    }))
  );
}
