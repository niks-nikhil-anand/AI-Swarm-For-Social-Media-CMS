// Temporal activities for the research workflow.
// Activities run in the worker process and may touch the DB and network.

import { prisma } from "../lib/prisma";
import { searxngSearch } from "../lib/searxng";
import { MAX_RESULTS_PER_SEARCH, MAX_SNIPPET_LENGTH } from "../lib/constants/searxng";

export interface StoredSearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string | null;
}

export async function performSearch(input: {
  projectId: string;
  query: string;
  agentId?: string;
}): Promise<StoredSearchResult[]> {
  const { projectId, query, agentId } = input;

  if (agentId) {
    await prisma.projectAgent.updateMany({
      where: { id: agentId, projectId },
      data: { status: "Working", startedAt: new Date() },
    });
  }

  const response = await searxngSearch(query);
  const top = response.results.slice(0, MAX_RESULTS_PER_SEARCH);

  const rows: StoredSearchResult[] = [];
  for (let i = 0; i < top.length; i++) {
    const r = top[i];
    const row = await prisma.searchResult.upsert({
      where: { projectId_url: { projectId, url: r.url.slice(0, 2048) } },
      create: {
        projectId,
        query,
        rank: i + 1,
        title: r.title,
        url: r.url.slice(0, 2048),
        snippet: r.content?.slice(0, MAX_SNIPPET_LENGTH),
        engine: r.engine,
      },
      update: { rank: i + 1, query },
    });
    rows.push({ id: row.id, title: row.title, url: row.url, snippet: row.snippet });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { searches: { increment: 1 } },
  });

  if (agentId) {
    await prisma.timelineEvent.create({
      data: { projectId, projectAgentId: agentId, type: "Search", text: query },
    });
    await prisma.projectAgent.updateMany({
      where: { id: agentId, projectId },
      data: { status: "Done", progress: 100, completedAt: new Date() },
    });
  }

  return rows;
}

export async function recordEvidence(input: {
  projectId: string;
  agentId: string;
  searchResultId?: string;
  content: string;
  topic: string;
  sourceUrl: string;
  sourceTitle?: string;
}): Promise<string> {
  const evidence = await prisma.evidence.create({ data: input });
  return evidence.id;
}

export async function markProjectComplete(input: {
  projectId: string;
  failed?: boolean;
}): Promise<void> {
  await prisma.project.update({
    where: { id: input.projectId },
    data: {
      status: input.failed ? "Failed" : "Complete",
      completedAt: new Date(),
    },
  });
}
