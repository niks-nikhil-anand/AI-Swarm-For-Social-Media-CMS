import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUserId } from "../../../../../../lib/auth";
import { getWorkflowStatus } from "../../../../../../lib/temporal";

// GET /api/projects/[id]/workflow/status — current Temporal workflow status.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true, status: true },
  });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const workflowId = `research-${projectId}`;
  const status = await getWorkflowStatus(workflowId);

  return NextResponse.json({
    workflowId,
    workflowStatus: status,
    projectStatus: project.status,
  });
}
