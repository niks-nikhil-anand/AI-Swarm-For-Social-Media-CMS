import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUserId } from "../../../lib/auth";
import { searxngSearch } from "../../../lib/searxng";
import { MAX_RESULTS_PER_SEARCH, MAX_SNIPPET_LENGTH } from "../../../lib/constants/searxng";

// POST /api/search — run a SearXNG search for a project and persist the results.
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { projectId?: string; query?: string; categories?: string[]; language?: string; agentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, query, categories, language, agentId } = body;
  if (!projectId || !query?.trim()) {
    return NextResponse.json({ error: "projectId and query are required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let response;
  try {
    response = await searxngSearch(query.trim(), { categories, language });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 502 }
    );
  }

  const top = response.results
    .filter((r) => {
      try {
        const protocol = new URL(r.url).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    })
    .slice(0, MAX_RESULTS_PER_SEARCH);

  const stored = await prisma.$transaction(
    async (tx) => {
      const rows = [];
      for (let i = 0; i < top.length; i++) {
        const r = top[i];
        rows.push(
          await tx.searchResult.upsert({
            where: { projectId_url: { projectId, url: r.url.slice(0, 2048) } },
            create: {
              projectId,
              query: query.trim(),
              rank: i + 1,
              title: r.title,
              url: r.url.slice(0, 2048),
              snippet: r.content?.slice(0, MAX_SNIPPET_LENGTH),
              engine: r.engine,
            },
            update: {
              rank: i + 1,
              query: query.trim(),
              snippet: r.content?.slice(0, MAX_SNIPPET_LENGTH),
            },
          })
        );
      }

      await tx.project.update({
        where: { id: projectId },
        data: { searches: { increment: 1 } },
      });

      // Timeline events require an agent; only log when the caller supplies one.
      if (agentId) {
        const agent = await tx.projectAgent.findFirst({
          where: { id: agentId, projectId },
          select: { id: true },
        });
        if (agent) {
          await tx.timelineEvent.create({
            data: { projectId, projectAgentId: agentId, type: "Search", text: query.trim() },
          });
        }
      }

      return rows;
    },
    { timeout: 30000 } // Increase timeout to 30 seconds for search result persistence
  );

  return NextResponse.json({
    query: query.trim(),
    count: stored.length,
    results: stored.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      rank: r.rank,
      engine: r.engine,
    })),
  });
}
