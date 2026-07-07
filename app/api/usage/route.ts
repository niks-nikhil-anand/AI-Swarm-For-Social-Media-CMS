import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUserId } from "../../../lib/auth";

const ALLOWED_PERIODS = new Set([7, 30, 90]);

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const requestedDays = Number(request.nextUrl.searchParams.get("days") ?? 30);
  const days = ALLOWED_PERIODS.has(requestedDays) ? requestedDays : 30;
  const now = new Date();
  const periodStart = startOfDay(now);
  periodStart.setDate(periodStart.getDate() - (days - 1));
  const previousStart = new Date(periodStart);
  previousStart.setDate(previousStart.getDate() - days);

  const [currentProjects, previousProjects, currentAgents, currentRequests, previousRequests] = await Promise.all([
    prisma.project.findMany({
      where: { userId, createdAt: { gte: periodStart } },
      select: { format: true, status: true, tokensIn: true, tokensOut: true, searches: true, createdAt: true },
    }),
    prisma.project.findMany({
      where: { userId, createdAt: { gte: previousStart, lt: periodStart } },
      select: { status: true, tokensIn: true, tokensOut: true, searches: true },
    }),
    prisma.projectAgent.findMany({
      where: { project: { userId, createdAt: { gte: periodStart } } },
      select: { role: true },
    }),
    prisma.timelineEvent.count({ where: { project: { userId }, createdAt: { gte: periodStart } } }),
    prisma.timelineEvent.count({ where: { project: { userId }, createdAt: { gte: previousStart, lt: periodStart } } }),
  ]);

  const totalTokens = (rows: { tokensIn: number; tokensOut: number }[]) =>
    rows.reduce((sum, project) => sum + project.tokensIn + project.tokensOut, 0);
  const totalSearches = (rows: { searches: number }[]) =>
    rows.reduce((sum, project) => sum + project.searches, 0);

  const tokensIn = currentProjects.reduce((sum, project) => sum + project.tokensIn, 0);
  const tokensOut = currentProjects.reduce((sum, project) => sum + project.tokensOut, 0);
  const searches = totalSearches(currentProjects);
  const activeProjects = currentProjects.filter((project) => project.status === "Running").length;
  const previousActiveProjects = previousProjects.filter((project) => project.status === "Running").length;

  const dailyProjects = Array.from({ length: days }, () => 0);
  for (const project of currentProjects) {
    const dayIndex = Math.floor((startOfDay(project.createdAt).getTime() - periodStart.getTime()) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < days) dailyProjects[dayIndex] += 1;
  }

  const formatMap = new Map<string, { projects: number; tokens: number }>();
  for (const project of currentProjects) {
    const current = formatMap.get(project.format) ?? { projects: 0, tokens: 0 };
    current.projects += 1;
    current.tokens += project.tokensIn + project.tokensOut;
    formatMap.set(project.format, current);
  }

  const roleMap = new Map<string, number>();
  for (const agent of currentAgents) {
    const role = agent.role || "Unspecified";
    roleMap.set(role, (roleMap.get(role) ?? 0) + 1);
  }

  return NextResponse.json({
    periodDays: days,
    totals: { tokens: tokensIn + tokensOut, tokensIn, tokensOut, searches, requests: currentRequests, projects: currentProjects.length, activeProjects },
    deltas: {
      tokens: pctDelta(tokensIn + tokensOut, totalTokens(previousProjects)),
      searches: pctDelta(searches, totalSearches(previousProjects)),
      requests: pctDelta(currentRequests, previousRequests),
      projects: pctDelta(currentProjects.length, previousProjects.length),
      activeProjects: pctDelta(activeProjects, previousActiveProjects),
    },
    dailyProjects,
    usageByFormat: Array.from(formatMap, ([format, stats]) => ({ format, ...stats }))
      .sort((a, b) => b.tokens - a.tokens || b.projects - a.projects),
    agentRoles: Array.from(roleMap, ([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count),
  });
}
