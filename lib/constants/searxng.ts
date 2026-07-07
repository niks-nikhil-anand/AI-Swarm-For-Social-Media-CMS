// SearXNG research configuration.

// Engines enabled in searxng-settings.yml; keep the two lists in sync.
export const SAFE_ENGINES = [
  "google",
  "bing",
  "duckduckgo",
  "startpage",
  "qwant",
  "brave",
] as const;

export const RESEARCH_CATEGORIES = ["general", "science", "news"] as const;

// Max results persisted per search call.
export const MAX_RESULTS_PER_SEARCH = 20;

// Snippets are capped before storage to keep rows small.
export const MAX_SNIPPET_LENGTH = 2000;

// Per-request timeout against the SearXNG instance (ms).
export const SEARXNG_TIMEOUT_MS = 10_000;
