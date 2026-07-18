import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUserId } from "../../../../lib/auth";
import { getWorkflowStatus } from "../../../../lib/temporal";

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
      slides: { orderBy: { n: "asc" } },
      sections: { orderBy: { n: "asc" } },
      references: true,
      timelineEvents: {
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { projectAgent: { select: { name: true, slug: true, accent: true } } },
      },
      searchResults: { orderBy: [{ retrievedAt: "desc" }, { rank: "asc" }], take: 100 },
      evidence: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { projectAgent: { select: { name: true, slug: true } } },
      },
      _count: { select: { searchResults: true, slides: true } },
    },
  });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Reconcile the small failure window between the last agent finishing and
  // the workflow's final project update. Agent state is persisted first, so a
  // run with every agent Done must not remain displayed as Running.
  const allAgentsDone = project.agents.length > 0 && project.agents.every((agent) => agent.status === "Done");
  let effectiveStatus = project.status;
  let effectiveCompletedAt = project.completedAt;
  let effectiveDuration = project.durationSeconds;
  let terminalStatus: "Complete" | "Failed" | null = null;
  if (project.status === "Running") {
    if (allAgentsDone) {
      terminalStatus = "Complete";
    } else {
      const workflowStatus = await getWorkflowStatus(`research-${project.id}`, 1500);
      if (workflowStatus === "COMPLETED") terminalStatus = "Complete";
      if (["FAILED", "CANCELLED", "TERMINATED", "TIMED_OUT"].includes(workflowStatus)) terminalStatus = "Failed";
    }
  }
  if (terminalStatus) {
    const completedAt = new Date();
    const durationSeconds = Math.max(0, Math.round((completedAt.getTime() - project.createdAt.getTime()) / 1000));
    await prisma.project.update({
      where: { id: project.id },
      data: { status: terminalStatus, completedAt, durationSeconds },
    });
    effectiveStatus = terminalStatus;
    effectiveCompletedAt = completedAt;
    effectiveDuration = durationSeconds;
  }

  return NextResponse.json({
    id: project.id,
    title: project.title,
    goal: project.goal,
    format: project.format,
    status: effectiveStatus,
    cost: project.cost,
    tokensIn: project.tokensIn,
    tokensOut: project.tokensOut,
    searches: project.searches,
    durationSeconds: effectiveDuration,
    wordCount: project.wordCount,
    summary: project.summary,
    createdAt: project.createdAt.toISOString(),
    completedAt: effectiveCompletedAt?.toISOString() ?? null,
    agents: project.agents.map((a) => ({
      id: a.id, slug: a.slug, name: a.name, short: a.short, icon: a.icon,
      accent: a.accent, role: a.role, why: a.why, deps: a.deps, layer: a.layer,
      status: a.status, progress: a.progress,
      startedAt: a.startedAt?.toISOString() ?? null,
      completedAt: a.completedAt?.toISOString() ?? null,
    })),
    sources: project.sources.map((s) => ({
      id: s.id, host: s.host, title: s.title, by: s.by, verified: s.verified,
    })),
    searchResultsCount: project._count.searchResults,
    slidesCount: project._count.slides,
    slides: project.slides.map((s) => ({
      n: s.n,
      kind: s.kind.toLowerCase(),
      title: s.title,
      sub: s.sub,
      footer: s.footer,
      stat: s.stat,
      statSub: s.statSub,
      body: s.body,
      bullets: s.bullets,
      chart: s.chart ? s.chart.toLowerCase() : null,
    })),
    sections: project.sections.map((s) => ({
      n: s.n, heading: s.heading, body: s.body, keyTakeaway: s.keyTakeaway, citations: s.citations,
    })),
    references: project.references.map((r) => ({
      refId: r.refId, url: r.url, title: r.title,
    })),
    timeline: project.timelineEvents.map((event) => ({
      id: event.id,
      type: event.type,
      text: event.text,
      url: event.url,
      topic: event.topic,
      createdAt: event.createdAt.toISOString(),
      agent: event.projectAgent,
    })),
    searchResults: project.searchResults.map((result) => ({
      id: result.id,
      query: result.query,
      rank: result.rank,
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      engine: result.engine,
      retrievedAt: result.retrievedAt.toISOString(),
    })),
    evidence: project.evidence.map((item) => ({
      id: item.id,
      content: item.content,
      topic: item.topic,
      sourceUrl: item.sourceUrl,
      sourceTitle: item.sourceTitle,
      verified: item.verified,
      verifiedBy: item.verifiedBy,
      createdAt: item.createdAt.toISOString(),
      agent: item.projectAgent,
    })),
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
