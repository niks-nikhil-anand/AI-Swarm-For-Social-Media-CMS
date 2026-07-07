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
    select: { status: true, durationSeconds: true },
  });

  const statusStats: Record<string, { count: number; avgDuration: number }> = {};
  const durations: Record<string, number[]> = {};

  for (const p of projects) {
    const status = p.status || "Draft";
    if (!statusStats[status]) {
      statusStats[status] = { count: 0, avgDuration: 0 };
      durations[status] = [];
    }
    statusStats[status].count += 1;
    if (p.durationSeconds) {
      durations[status].push(p.durationSeconds);
    }
  }

  // Calculate average durations
  for (const status of Object.keys(statusStats)) {
    if (durations[status].length > 0) {
      statusStats[status].avgDuration =
        durations[status].reduce((a, b) => a + b, 0) / durations[status].length;
    }
  }

  const breakdown = Object.entries(statusStats)
    .map(([status, stats]) => ({
      status,
      count: stats.count,
      avgDurationSeconds: Math.round(stats.avgDuration),
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    breakdown,
    total: projects.length,
  });
}
