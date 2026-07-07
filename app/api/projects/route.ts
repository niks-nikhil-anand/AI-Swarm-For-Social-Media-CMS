import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUserId } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const requestedDays = Number(request.nextUrl.searchParams.get("days"));
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : null;
  const periodStart = days ? new Date() : null;
  if (periodStart && days) {
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (days - 1));
  }

  const projects = await prisma.project.findMany({
    where: { userId, ...(periodStart ? { createdAt: { gte: periodStart } } : {}) },
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

interface RosterAgent {
  id?: string;
  name?: string;
  short?: string;
  icon?: string;
  accent?: string;
  role?: string;
  why?: string;
  deps?: string[];
  layer?: number;
}

// POST /api/projects — create a draft project with its frozen agent team
// (used when a run is launched).
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { title?: string; goal?: string; format?: string; agents?: RosterAgent[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, goal, format, agents } = body;
  if (!title?.trim() || !goal?.trim()) {
    return NextResponse.json({ error: "title and goal are required" }, { status: 400 });
  }

  const roster = (agents ?? []).filter((a) => a.name?.trim());

  const project = await prisma.project.create({
    data: {
      userId,
      title: title.trim(),
      goal: goal.trim(),
      format: format?.trim() || "deck",
      agents: {
        create: roster.map((a, i) => ({
          slug: a.id?.trim() || `agent-${i}`,
          name: a.name!.trim(),
          short: a.short?.trim() || a.name!.trim().slice(0, 6),
          icon: a.icon || "user",
          accent: a.accent || "var(--accent)",
          role: a.role || "Specialist",
          why: a.why || "",
          deps: a.deps ?? [],
          layer: a.layer ?? 0,
        })),
      },
    },
    include: { agents: { select: { id: true, slug: true } } },
  });

  return NextResponse.json(
    { id: project.id, status: project.status, agents: project.agents },
    { status: 201 }
  );
}
