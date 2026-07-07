import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUserId } from "../../../../lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const projects = await prisma.project.findMany({
    where: { userId, createdAt: { gte: startOfThisMonth } },
    select: { format: true, tokensIn: true, tokensOut: true }
  });

  const modelStats: Record<string, { tokens: number; count: number }> = {};

  for (const p of projects) {
    const model = p.format || "unknown";
    if (!modelStats[model]) {
      modelStats[model] = { tokens: 0, count: 0 };
    }
    modelStats[model].tokens += p.tokensIn + p.tokensOut;
    modelStats[model].count += 1;
  }

  const breakdown = Object.entries(modelStats).map(([model, stats]) => ({
    model,
    tokens: stats.tokens,
    projects: stats.count,
    avgTokensPerProject: stats.count > 0 ? Math.round(stats.tokens / stats.count) : 0,
  }));

  return NextResponse.json({
    breakdown: breakdown.sort((a, b) => b.tokens - a.tokens),
    total: projects.length,
  });
}
