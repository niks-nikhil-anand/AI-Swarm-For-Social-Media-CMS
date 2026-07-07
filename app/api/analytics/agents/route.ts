import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUserId } from "../../../../lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const agents = await prisma.projectAgent.findMany({
    where: { project: { userId, createdAt: { gte: startOfThisMonth } } },
    select: { role: true },
  });

  const roleStats: Record<string, number> = {};
  for (const a of agents) {
    const role = a.role || "Unspecified";
    roleStats[role] = (roleStats[role] || 0) + 1;
  }

  const breakdown = Object.entries(roleStats)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    breakdown,
    total: agents.length,
  });
}
