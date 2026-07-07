import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUserId } from "../../../../lib/auth";

// GET /api/projects/[id] — full project detail (agents, sources, counts).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      agents: { orderBy: { layer: "asc" } },
      sources: true,
      _count: { select: { searchResults: true, slides: true } },
    },
  });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: project.id,
    title: project.title,
    goal: project.goal,
    format: project.format,
    status: project.status,
    cost: project.cost,
    tokensIn: project.tokensIn,
    tokensOut: project.tokensOut,
    searches: project.searches,
    durationSeconds: project.durationSeconds,
    wordCount: project.wordCount,
    summary: project.summary,
    createdAt: project.createdAt.toISOString(),
    completedAt: project.completedAt?.toISOString() ?? null,
    agents: project.agents.map((a) => ({
      id: a.id, slug: a.slug, name: a.name, short: a.short, icon: a.icon,
      accent: a.accent, role: a.role, why: a.why, deps: a.deps, layer: a.layer,
      status: a.status, progress: a.progress,
    })),
    sources: project.sources.map((s) => ({
      id: s.id, host: s.host, title: s.title, by: s.by, verified: s.verified,
    })),
    searchResultsCount: project._count.searchResults,
    slidesCount: project._count.slides,
  });
}

const PATCHABLE_STATUSES = ["Draft", "Running", "Complete", "Failed"] as const;

// PATCH /api/projects/[id] — update status/summary fields from the client flow.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { userId: true, createdAt: true },
  });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let body: { status?: string; summary?: string; wordCount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!PATCHABLE_STATUSES.includes(body.status as (typeof PATCHABLE_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
    if (body.status === "Complete" || body.status === "Failed") {
      data.completedAt = new Date();
      data.durationSeconds = Math.round((Date.now() - project.createdAt.getTime()) / 1000);
    }
  }
  if (typeof body.summary === "string") data.summary = body.summary;
  if (typeof body.wordCount === "number") data.wordCount = body.wordCount;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
