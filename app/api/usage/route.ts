import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUserId } from "../../../lib/auth";

const MONTH_BUDGET = 100; // a target the user would configure, not a queried value
const SPEND_SERIES_DAYS = 30;

function pctDelta(current: number, previous: number): number {
  if (previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const seriesStart = new Date(now);
  seriesStart.setDate(seriesStart.getDate() - (SPEND_SERIES_DAYS - 1));
  seriesStart.setHours(0, 0, 0, 0);

  const [thisMonthProjects, lastMonthProjects, allProjects, requestCount] = await Promise.all([
    prisma.project.findMany({ where: { userId, createdAt: { gte: startOfThisMonth } } }),
    prisma.project.findMany({ where: { userId, createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
    prisma.project.findMany({ where: { userId, createdAt: { gte: seriesStart } }, select: { cost: true, createdAt: true } }),
    prisma.timelineEvent.count({ where: { project: { userId } } }),
  ]);

  const sum = (rows: { cost: number }[]) => rows.reduce((a, r) => a + r.cost, 0);
  const monthSpend = sum(thisMonthProjects);
  const lastMonth = sum(lastMonthProjects);

  const tokensInThisMonth = thisMonthProjects.reduce((a, p) => a + p.tokensIn, 0);
  const tokensOutThisMonth = thisMonthProjects.reduce((a, p) => a + p.tokensOut, 0);
  const tokensThisMonth = tokensInThisMonth + tokensOutThisMonth;
  const tokensLastMonth = lastMonthProjects.reduce((a, p) => a + p.tokensIn + p.tokensOut, 0);
  const searchesThisMonth = thisMonthProjects.reduce((a, p) => a + p.searches, 0);
  const searchesLastMonth = lastMonthProjects.reduce((a, p) => a + p.searches, 0);

  const spendSeries: number[] = Array.from({ length: SPEND_SERIES_DAYS }, () => 0);
  for (const p of allProjects) {
    const dayIndex = Math.floor((p.createdAt.getTime() - seriesStart.getTime()) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < SPEND_SERIES_DAYS) spendSeries[dayIndex] += p.cost;
  }

  return NextResponse.json({
    monthSpend,
    monthBudget: MONTH_BUDGET,
    lastMonth,
    totals: {
      tokens: tokensThisMonth / 1e6,
      tokensIn: tokensInThisMonth / 1e6,
      tokensOut: tokensOutThisMonth / 1e6,
      searches: searchesThisMonth,
      projects: thisMonthProjects.length,
      requests: requestCount,
    },
    deltas: {
      spend: pctDelta(monthSpend, lastMonth),
      tokens: pctDelta(tokensThisMonth, tokensLastMonth),
      searches: pctDelta(searchesThisMonth, searchesLastMonth),
      projects: pctDelta(thisMonthProjects.length, lastMonthProjects.length),
    },
    spendSeries,
  });
}
