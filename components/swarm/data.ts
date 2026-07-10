/* ============================================================
   SWARM — Shared types and production configurations
   Real data comes from the database and AI-generated content.
   Demo data is in demoData.ts (for UI development only).
   ============================================================ */

/* ---------- Types ---------- */
export type AgentStatus =
  | "idle"
  | "working"
  | "blocked"
  | "waiting"
  | "done"
  | "error";

export interface Agent {
  id: string;
  name: string;
  short: string;
  icon: string;
  accent: string;
  role: string;
  why: string;
  /** upstream agents this one consumes findings from */
  deps: string[];
  /** DAG depth (used to lay out the graph) */
  layer: number;
  /** sim-clock window (0..100) during which the agent works */
  t0?: number;
  t1?: number;
  /** [simClock, label] action checkpoints */
  actions?: [number, string][];
}

export type TimelineEventType =
  | "thought"
  | "search"
  | "url"
  | "note"
  | "handoff"
  | "system"
  | "error"
  | "warn";

export interface TimelineEvent {
  t: number;
  agent: string;
  type: TimelineEventType;
  text: string;
  url?: string;
  topic?: string;
  to?: string;
}

export interface WorkspaceGroup {
  topic: string;
  agent: string;
  notes: string[];
}

// A persisted SearXNG result returned by /api/search and /api/search/results.
export interface SearchResult {
  id: string;
  query?: string;
  title: string;
  url: string;
  snippet?: string | null;
  rank: number;
  engine?: string | null;
  retrievedAt?: string;
}

export interface Source {
  host: string;
  title: string;
  by: string;
  verified: boolean;
}

export type SlideKind = "title" | "stat" | "bullets" | "chart" | "close";

export interface Slide {
  n: number;
  kind: SlideKind;
  title: string;
  sub?: string;
  footer?: string;
  stat?: string;
  statSub?: string;
  body?: string;
  bullets?: string[];
  chart?: "dist" | "line" | "bars";
}

export type ProjectStatus = "running" | "complete" | "failed";

export interface Project {
  id: string;
  title: string;
  fmt: string;
  fmtIcon: string;
  status: ProjectStatus;
  date: string;
  agents: number;
  accent: string;
  cost: number;
  tokIn: number;
  tokOut: number;
  searches: number;
  duration: string;
  words: number;
  sourcesN: number;
  kind: "pptx" | "doc";
  summary: string;
  goal: string;
}

export interface OutputFormat {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

export interface Usage {
  monthSpend: number;
  monthBudget: number;
  lastMonth: number;
  totals: { tokens: number; searches: number; projects: number; requests: number };
  deltas: { spend: number; tokens: number; searches: number; projects: number };
  spendSeries: number[];
  byModel: { name: string; note?: string; cost: number; color: string }[];
  byAgent: { name: string; cost: number; color: string }[];
}

/* ---------- Default agent roster (used by Roles UI) ---------- */
export const AGENTS: Agent[] = [
  { id: "lead", name: "Lead Researcher", short: "Lead", icon: "target", accent: "var(--purple)",
    role: "Orchestrator",
    why: "Decomposes the goal into research threads, assigns scope to each agent, and arbitrates conflicts.",
    deps: [], layer: 0 },
  { id: "web", name: "Web Researcher", short: "Web", icon: "globe", accent: "var(--blue)",
    role: "Primary research",
    why: "Runs live web searches across sources; harvests primary material into the workspace.",
    deps: ["lead"], layer: 1 },
  { id: "data", name: "Data Analyst", short: "Data", icon: "bar-chart", accent: "var(--cyan)",
    role: "Quantitative",
    why: "Extracts figures, timelines, and metrics; builds visualization-ready datasets.",
    deps: ["lead", "web"], layer: 2 },
  { id: "fact", name: "Fact-Checker", short: "Fact", icon: "shield", accent: "var(--st-done)",
    role: "Verification",
    why: "Cross-checks claims against independent sources and flags anything unverifiable.",
    deps: ["web"], layer: 2 },
  { id: "writer", name: "Content Writer", short: "Writer", icon: "edit", accent: "var(--blue)",
    role: "Narrative",
    why: "Turns verified findings into a tight, executive-ready narrative arc.",
    deps: ["fact", "data"], layer: 3 },
  { id: "designer", name: "Presentation Designer", short: "Design", icon: "layers", accent: "var(--purple)",
    role: "Layout",
    why: "Lays narrative onto branded templates, places charts, and enforces visual rhythm.",
    deps: ["writer"], layer: 4 },
  { id: "synth", name: "Synthesis Agent", short: "Synth", icon: "wand", accent: "var(--accent)",
    role: "Assembly",
    why: "Compiles artifacts into the final output with citations and metadata.",
    deps: ["designer", "fact"], layer: 5 },
];

/* ---------- Model providers (Settings) ---------- */
export interface ModelOption {
  id: string;
  label: string;
}
export type ProviderKind = "hosted" | "opensource" | "custom";
export interface Provider {
  id: string;
  label: string;
  icon: string;
  kind: ProviderKind;
  desc: string;
  /** curated models; empty array means free-text model entry (custom endpoints) */
  models: ModelOption[];
  keyPlaceholder?: string;
  defaultBaseUrl?: string;
}
export const PROVIDERS: Provider[] = [
  {
    id: "anthropic", label: "Anthropic", icon: "wand", kind: "hosted",
    desc: "Claude — powers the orchestrator by default.",
    keyPlaceholder: "sk-ant-…",
    models: [
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "google", label: "Google", icon: "star", kind: "hosted",
    desc: "Gemini models.",
    keyPlaceholder: "AIza…",
    models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ],
  },
  {
    id: "openai", label: "OpenAI", icon: "zap", kind: "hosted",
    desc: "GPT models.",
    keyPlaceholder: "sk-…",
    models: [
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "o4-mini", label: "o4-mini" },
    ],
  },
  {
    id: "openrouter", label: "OpenRouter", icon: "link", kind: "hosted",
    desc: "Single API key routing to 300+ models across every major lab.",
    keyPlaceholder: "sk-or-v1-…",
    models: [
      { id: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5" },
      { id: "openai/gpt-4.1", label: "GPT-4.1" },
      { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "deepseek/deepseek-v3", label: "DeepSeek V3" },
    ],
  },
  {
    id: "nvidia", label: "NVIDIA", icon: "activity", kind: "hosted",
    desc: "NVIDIA NIM-hosted models.",
    keyPlaceholder: "nvapi-…",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    models: [
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Llama 3.1 Nemotron 70B" },
      { id: "meta/llama-3.1-405b-instruct", label: "Llama 3.1 405B" },
      { id: "mistralai/mixtral-8x22b-instruct-v0.1", label: "Mixtral 8x22B" },
      { id: "microsoft/phi-3-medium-128k-instruct", label: "Phi-3 Medium 128K" },
    ],
  },
  {
    id: "opensource", label: "Open-source", icon: "server", kind: "opensource",
    desc: "Self-hosted models via Ollama, vLLM, or any OpenAI-compatible server.",
    keyPlaceholder: "optional",
    defaultBaseUrl: "http://localhost:11434/v1",
    models: [
      { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "mixtral-8x22b", label: "Mixtral 8x22B" },
      { id: "deepseek-v3", label: "DeepSeek V3" },
      { id: "qwen2.5-72b", label: "Qwen 2.5 72B" },
    ],
  },
  {
    id: "custom", label: "Custom / other API", icon: "box", kind: "custom",
    desc: "Any OpenAI-compatible endpoint — Groq, Together, Fireworks, Azure, a local proxy…",
    keyPlaceholder: "optional",
    models: [],
  },
];

/* ---------- Default agent roster (Settings) ---------- */
export const DEFAULT_AGENT_ROSTER: Agent[] = [
  { id: "lead", name: "Lead Researcher", short: "Lead", icon: "target", accent: "var(--purple)",
    role: "Orchestrator",
    why: "Decomposes the goal into research threads, assigns scope to each agent, and arbitrates conflicts.",
    deps: [], layer: 0 },
  { id: "web", name: "Web Researcher", short: "Web", icon: "globe", accent: "var(--blue)",
    role: "Primary research",
    why: "Runs live web searches across NIST, academic and vendor sources; harvests primary material into the workspace.",
    deps: ["lead"], layer: 1 },
  { id: "data", name: "Data Analyst", short: "Data", icon: "bar-chart", accent: "var(--cyan)",
    role: "Quantitative",
    why: "Extracts figures — qubit counts, timelines, migration costs — and builds the chart-ready datasets.",
    deps: ["lead", "web"], layer: 2 },
  { id: "fact", name: "Fact-Checker", short: "Fact", icon: "shield", accent: "var(--st-done)",
    role: "Verification",
    why: "Cross-checks every claim against at least two independent sources and flags anything unverifiable.",
    deps: ["web"], layer: 2 },
  { id: "writer", name: "Content Writer", short: "Writer", icon: "edit", accent: "var(--blue)",
    role: "Narrative",
    why: "Turns verified findings into a tight, executive-ready narrative arc.",
    deps: ["fact", "data"], layer: 3 },
];

/* ---------- Skills (uploadable agent capabilities) ---------- */
export type SkillCategory = "Research" | "Writing" | "Data Analysis" | "Automation" | "Custom";
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}
export const SKILL_CATEGORY_ICON: Record<SkillCategory, string> = {
  Research: "search", Writing: "edit", "Data Analysis": "bar-chart", Automation: "wand", Custom: "box",
};
export const SKILL_CATEGORIES: SkillCategory[] = ["Research", "Writing", "Data Analysis", "Automation", "Custom"];
export const DEFAULT_SKILLS: Skill[] = [
  { id: "skill-web-research", name: "Web Research Toolkit", description: "Structured live search, source ranking and citation harvesting for the Web Researcher agent.", category: "Research", version: "1.2.0", fileName: "web-research-toolkit.json", fileSize: 18_420, uploadedAt: "28 May 2026" },
  { id: "skill-slide-formatter", name: "Slide Deck Formatter", description: "Lays narrative content onto branded slide templates and enforces visual rhythm.", category: "Writing", version: "2.0.1", fileName: "slide-formatter.py", fileSize: 9_150, uploadedAt: "24 May 2026" },
  { id: "skill-citation-verifier", name: "Citation Verifier", description: "Cross-checks quantitative claims against at least two independent sources.", category: "Data Analysis", version: "1.0.4", fileName: "citation-verifier.yaml", fileSize: 4_960, uploadedAt: "19 May 2026" },
  { id: "skill-auto-summarizer", name: "Auto Summarizer", description: "Condenses long-form findings into an executive-ready narrative arc.", category: "Automation", version: "3.1.0", fileName: "auto-summarizer.js", fileSize: 12_030, uploadedAt: "12 May 2026" },
];

/* ---------- Output-format options (Define stage) ---------- */
export const FORMATS: OutputFormat[] = [
  { id: "pptx", label: "PowerPoint", desc: "Slide deck, 10–20 slides", icon: "layers" },
  { id: "pdf",  label: "PDF Report", desc: "Long-form, sectioned", icon: "file-text" },
  { id: "docx", label: "DOCX", desc: "Editable Word document", icon: "file-text" },
  { id: "blog", label: "Blog Post", desc: "Web-ready article", icon: "edit" },
  { id: "md",   label: "Markdown", desc: "Plain structured text", icon: "file-source" },
  { id: "exec", label: "Executive Summary", desc: "One-pager, key points", icon: "clipboard" },
  { id: "repo", label: "Code Repo", desc: "Scaffold + README", icon: "git-branch" },
];
