/* ============================================================
   DEMO DATA ONLY — Used for Storybook and UI development
   This should NOT be used in production.
   Real data comes from the database and LLM agents.
   ============================================================ */

import type { Agent, TimelineEvent, WorkspaceGroup, Source, Slide, Usage } from "./data";

/* ---------- Demo Agents (for UI visualization only) ---------- */
export const DEMO_AGENTS: Agent[] = [
  {
    id: "lead", name: "Lead Researcher", short: "Lead", icon: "target", accent: "var(--purple)",
    role: "Orchestrator",
    why: "Decomposes the goal into research threads, assigns scope to each agent, and arbitrates conflicts.",
    deps: [], layer: 0, t0: 0, t1: 100,
    actions: [
      [0, "Decomposing goal into 4 research threads"],
      [14, "Dispatching scope to Web Researcher & Data Analyst"],
      [46, "Reviewing intermediate findings"],
      [70, "Re-planning: escalation from Fact-Checker"],
      [88, "Approving synthesis outline"],
    ],
  },
  {
    id: "web", name: "Web Researcher", short: "Web", icon: "globe", accent: "var(--blue)",
    role: "Primary research",
    why: "Runs live web searches across NIST, academic and vendor sources; harvests primary material into the workspace.",
    deps: ["lead"], layer: 1, t0: 12, t1: 58,
    actions: [
      [12, "Searching: post-quantum cryptography NIST"],
      [22, "Reading nist.gov/pqc standardization"],
      [34, "Searching: Shor's algorithm RSA-2048 qubits"],
      [48, "Harvesting 9 sources to workspace"],
    ],
  },
  {
    id: "data", name: "Data Analyst", short: "Data", icon: "bar-chart", accent: "var(--cyan)",
    role: "Quantitative",
    why: "Extracts figures — qubit counts, timelines, migration costs — and builds the chart-ready datasets.",
    deps: ["lead", "web"], layer: 2, t0: 30, t1: 68,
    actions: [
      [30, "Waiting on Web Researcher harvest"],
      [40, "Extracting qubit-threshold estimates"],
      [54, "Modelling 'harvest-now-decrypt-later' exposure"],
      [62, "Building timeline & cost datasets"],
    ],
  },
  {
    id: "fact", name: "Fact-Checker", short: "Fact", icon: "shield", accent: "var(--st-done)",
    role: "Verification",
    why: "Cross-checks every claim against at least two independent sources and flags anything unverifiable.",
    deps: ["web"], layer: 2, t0: 36, t1: 74,
    actions: [
      [36, "Verifying: 'RSA-2048 broken by ~20M qubits'"],
      [52, "Cross-referencing Gidney & Ekerå 2019"],
      [68, "Flagged 1 claim — escalating to Lead"],
    ],
  },
  {
    id: "writer", name: "Content Writer", short: "Writer", icon: "edit", accent: "var(--blue)",
    role: "Narrative",
    why: "Turns verified findings into a tight, executive-ready narrative arc across 10 slides.",
    deps: ["fact", "data"], layer: 3, t0: 62, t1: 86,
    actions: [
      [62, "Drafting narrative spine (10 beats)"],
      [76, "Writing slide copy & speaker notes"],
      [84, "Tightening executive summary"],
    ],
  },
  {
    id: "designer", name: "Presentation Designer", short: "Design", icon: "layers", accent: "var(--purple)",
    role: "Layout",
    why: "Lays narrative onto branded slide templates, places charts, and enforces visual rhythm.",
    deps: ["writer"], layer: 4, t0: 80, t1: 95,
    actions: [
      [80, "Selecting layout system"],
      [88, "Placing charts on slides 5–7"],
      [93, "Applying type & spacing scale"],
    ],
  },
  {
    id: "synth", name: "Synthesis Agent", short: "Synth", icon: "wand", accent: "var(--accent)",
    role: "Assembly",
    why: "Compiles every approved artifact into the final .pptx with citations and a generation summary.",
    deps: ["designer", "fact"], layer: 5, t0: 92, t1: 100,
    actions: [
      [92, "Assembling deck.pptx"],
      [97, "Embedding 14 citations"],
    ],
  },
];

/* ---------- Demo Timeline (for simulation visualization) ---------- */
export const DEMO_TIMELINE: TimelineEvent[] = [
  { t: 1,  agent: "lead", type: "thought", text: "Goal parsed. Producing a 10-slide deck for a technical-but-exec audience." },
  { t: 4,  agent: "lead", type: "system", text: "Spawned 6 specialist agents. Dependency graph resolved." },
  { t: 8,  agent: "lead", type: "handoff", text: "Assigned primary research scope → Web Researcher", to: "web" },
  { t: 13, agent: "web",  type: "search", text: "post-quantum cryptography NIST standardization 2024" },
  { t: 16, agent: "web",  type: "url",    text: "csrc.nist.gov", url: "NIST — PQC standardization" },
  { t: 19, agent: "web",  type: "thought", text: "NIST finalized standards in Aug 2024." },
  { t: 93, agent: "synth", type: "system", text: "All upstream artifacts approved. Assembling deck.pptx…" },
  { t: 99, agent: "synth", type: "system", text: "✓ output generated — 10 slides, sources embedded." },
];

/* ---------- Demo Workspace Notes ---------- */
export const DEMO_WORKSPACE: WorkspaceGroup[] = [
  { topic: "Research Findings", agent: "web", notes: [
    "Conducted comprehensive web search",
    "Cross-referenced multiple authoritative sources",
  ]},
  { topic: "Data Analysis", agent: "data", notes: [
    "Extracted key metrics and statistics",
    "Built visualization-ready datasets",
  ]},
  { topic: "Verification", agent: "fact", notes: [
    "Cross-checked all quantitative claims",
    "Flagged uncertain areas",
  ]},
];

/* ---------- Demo Sources (for UI only) ---------- */
export const DEMO_SOURCES: Source[] = [
  { host: "example1.com", title: "First Example Source", by: "Web Researcher", verified: true },
  { host: "example2.com", title: "Second Example Source", by: "Web Researcher", verified: true },
  { host: "example3.com", title: "Third Example Source", by: "Fact-Checker", verified: true },
];

/* ---------- Demo Slides (for UI preview only) ---------- */
export const DEMO_SLIDES: Slide[] = [
  { n: 1,  kind: "title",  title: "Demo Presentation", sub: "This is a demo slide for UI testing" },
  { n: 2,  kind: "stat",   title: "Example Statistic", stat: "100%", statSub: "example metric", body: "Demo content" },
  { n: 3,  kind: "bullets",title: "Key Points", bullets: ["Demo point 1", "Demo point 2", "Demo point 3"] },
  { n: 4,  kind: "close",  title: "Thank You", footer: "demo-presentation.pptx" },
];

/* ---------- Demo Usage (for dashboard mock) ---------- */
export const DEMO_USAGE: Usage = {
  monthSpend: 42.8, monthBudget: 100, lastMonth: 36.2,
  totals: { tokens: 18.4, searches: 312, projects: 24, requests: 1284 },
  deltas: { spend: +18, tokens: +12, searches: +9, projects: +4 },
  spendSeries: Array(30).fill(0).map(() => Math.random() * 3),
  byModel: [
    { name: "Claude Sonnet 4.5", cost: 28.4, color: "var(--blue)" },
    { name: "Claude Haiku 4", cost: 4.2, color: "var(--purple)" },
  ],
  byAgent: [
    { name: "Lead Researcher", cost: 7.1, color: "var(--purple)" },
    { name: "Web Researcher", cost: 8.9, color: "var(--blue)" },
  ],
};
