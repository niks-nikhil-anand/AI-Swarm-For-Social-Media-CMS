import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUserId } from "../../../../lib/auth";

// GET /api/search/results?projectId=... — stored search results for a project.
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const results = await prisma.searchResult.findMany({
    where: { projectId },
    orderBy: [{ retrievedAt: "desc" }, { rank: "asc" }],
  });

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      query: r.query,
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      rank: r.rank,
      engine: r.engine,
      retrievedAt: r.retrievedAt.toISOString(),
    })),
  });
}
