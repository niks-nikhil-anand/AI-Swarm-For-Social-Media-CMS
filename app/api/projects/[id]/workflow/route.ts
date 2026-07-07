import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUserId } from "../../../../../lib/auth";
import { startResearchWorkflow, getWorkflowStatus } from "../../../../../lib/temporal";

// POST /api/projects/[id]/workflow — start the research workflow for a project.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { agents: { select: { id: true, slug: true } } },
  });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.status === "Running") {
    // The DB can say Running while nothing is actually executing (worker never
    // ran, Temporal down, process killed). Only block when the workflow is
    // genuinely alive; otherwise reset the stale status and allow a restart.
    const liveStatus = await getWorkflowStatus(`research-${projectId}`);
    if (liveStatus === "RUNNING") {
      return NextResponse.json({ error: "Project is already running" }, { status: 409 });
    }
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "Draft" },
    });
  }

  try {
    const workflowId = await startResearchWorkflow({
      projectId,
      goal: project.goal,
      agents: project.agents.map((a) => ({ id: a.id, slug: a.slug })),
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "Running" },
    });

    return NextResponse.json({ workflowId, status: "started" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start workflow" },
      { status: 502 }
    );
  }
}
