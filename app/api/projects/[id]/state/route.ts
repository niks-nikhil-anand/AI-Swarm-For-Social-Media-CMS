import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUserId } from "../../../../../lib/auth";

// GET /api/projects/[id]/state — live run state for the Run screen:
// project status, frozen team with per-agent status/progress, recent
// timeline events, and persisted search results.
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
      timelineEvents: {
        orderBy: { createdAt: "asc" },
        take: 200,
        include: { projectAgent: { select: { slug: true } } },
      },
      searchResults: { orderBy: [{ retrievedAt: "desc" }, { rank: "asc" }], take: 50 },
    },
  });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      status: project.status,
      searches: project.searches,
      cost: project.cost,
      createdAt: project.createdAt.toISOString(),
      completedAt: project.completedAt?.toISOString() ?? null,
    },
    agents: project.agents.map((a) => ({
      id: a.id, slug: a.slug, name: a.name, short: a.short, icon: a.icon,
      accent: a.accent, role: a.role, why: a.why, deps: a.deps, layer: a.layer,
      status: a.status, progress: a.progress,
      startedAt: a.startedAt?.toISOString() ?? null,
      completedAt: a.completedAt?.toISOString() ?? null,
    })),
    timeline: project.timelineEvents.map((e) => ({
      id: e.id,
      agentSlug: e.projectAgent?.slug ?? "",
      type: e.type,
      text: e.text,
      url: e.url,
      topic: e.topic,
      createdAt: e.createdAt.toISOString(),
    })),
    searchResults: project.searchResults.map((r) => ({
      id: r.id, query: r.query, title: r.title, url: r.url,
      snippet: r.snippet, rank: r.rank, engine: r.engine,
      retrievedAt: r.retrievedAt.toISOString(),
    })),
  });
}
