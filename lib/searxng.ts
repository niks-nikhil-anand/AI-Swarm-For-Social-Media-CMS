// Server-side client for a private SearXNG instance.
// JSON format must be enabled in the instance's settings.yml (`search.formats`).

import { SEARXNG_TIMEOUT_MS } from "./constants/searxng";

export interface SearXNGResult {
  title: string;
  url: string;
  content?: string;
  engine?: string;
  score?: number;
  category?: string;
  publishedDate?: string | null;
}

export interface SearXNGResponse {
  query: string;
  number_of_results: number;
  results: SearXNGResult[];
  answers: unknown[];
  corrections: unknown[];
  suggestions: string[];
}

export interface SearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
  time_range?: "day" | "month" | "year";
  safesearch?: 0 | 1 | 2;
}

function getBaseUrl(): string {
  const url = process.env.SEARXNG_URL || "http://localhost:8888";
  return url.replace(/\/$/, "");
}

export async function searxngSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearXNGResponse> {
  const params = new URLSearchParams({ q: query, format: "json" });
  if (options.categories?.length) params.set("categories", options.categories.join(","));
  if (options.engines?.length) params.set("engines", options.engines.join(","));
  if (options.language) params.set("language", options.language);
  if (options.pageno) params.set("pageno", String(options.pageno));
  if (options.time_range) params.set("time_range", options.time_range);
  if (options.safesearch !== undefined) params.set("safesearch", String(options.safesearch));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARXNG_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBaseUrl()}/search?${params}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Swarm-Research/1.0" },
    });
    if (!response.ok) {
      throw new Error(`SearXNG returned ${response.status}`);
    }
    return (await response.json()) as SearXNGResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("SearXNG search timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searxngHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${getBaseUrl()}/healthz`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
