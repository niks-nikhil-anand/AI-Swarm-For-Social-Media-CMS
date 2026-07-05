/* ============================================================
   SWARM — demo scenario data + shared types
   "Research the impact of quantum computing on cryptography
    and produce a 10-slide PowerPoint."
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

/* ---------- Agents (nodes of the swarm) ---------- */
export const AGENTS: Agent[] = [
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

/* ---------- Live activity timeline ---------- */
export const TIMELINE: TimelineEvent[] = [
  { t: 1,  agent: "lead", type: "thought", text: "Goal parsed. Producing a 10-slide deck for a technical-but-exec audience. Splitting into: fundamentals, threat model, timelines, mitigations." },
  { t: 4,  agent: "lead", type: "system", text: "Spawned 6 specialist agents. Dependency graph resolved." },
  { t: 8,  agent: "lead", type: "handoff", text: "Assigned primary research scope → Web Researcher", to: "web" },
  { t: 13, agent: "web",  type: "search", text: "post-quantum cryptography NIST standardization 2024" },
  { t: 16, agent: "web",  type: "url",    text: "csrc.nist.gov", url: "NIST — PQC standardization (FIPS 203/204/205)" },
  { t: 19, agent: "web",  type: "thought", text: "NIST finalized ML-KEM, ML-DSA and SLH-DSA in Aug 2024. This anchors the 'what to migrate to' slide." },
  { t: 23, agent: "web",  type: "search", text: "Shor's algorithm qubits required to break RSA-2048" },
  { t: 26, agent: "web",  type: "url",    text: "arxiv.org/abs/1905.09749", url: "Gidney & Ekerå — How to factor 2048-bit RSA" },
  { t: 30, agent: "web",  type: "note",   text: "Estimate: ~20M noisy qubits, 8 hours, to factor RSA-2048.", topic: "Threat timeline" },
  { t: 33, agent: "data", type: "thought", text: "Have enough to start. Building the capability-vs-time dataset for the headline chart." },
  { t: 37, agent: "web",  type: "search", text: "harvest now decrypt later HNDL risk enterprises" },
  { t: 38, agent: "fact", type: "thought", text: "Beginning verification pass. Priority: any quantitative claim that lands on a slide." },
  { t: 41, agent: "web",  type: "url",    text: "ncsc.gov.uk", url: "NCSC — Preparing for quantum-safe cryptography" },
  { t: 43, agent: "data", type: "note",   text: "Logical→physical qubit overhead ~1000:1 with surface codes.", topic: "Quantum capability" },
  { t: 47, agent: "web",  type: "note",   text: "~3–5% of TLS traffic could be retroactively decrypted under HNDL by 2035.", topic: "Threat timeline" },
  { t: 50, agent: "fact", type: "search", text: "Mosca theorem quantum risk X Y Z model" },
  { t: 53, agent: "data", type: "thought", text: "Cross-plotting Mosca's inequality: if X+Y > Z, you're already exposed." },
  { t: 55, agent: "fact", type: "url",    text: "globalriskinstitute.org", url: "2024 Quantum Threat Timeline Report" },
  { t: 59, agent: "data", type: "note",   text: "Median expert estimate: 17–24% chance of a cryptographically-relevant QC by 2034.", topic: "Threat timeline" },
  { t: 64, agent: "fact", type: "warn",   text: "Claim 'RSA broken by 2030' unsupported — strongest sources say 2030 is a low-probability tail, not a median." },
  { t: 67, agent: "fact", type: "handoff", text: "Escalating disputed claim to Lead for arbitration", to: "lead" },
  { t: 70, agent: "lead", type: "thought", text: "Agreed. Reframing slide 4 from a date to a probability distribution. Notifying Writer." },
  { t: 72, agent: "lead", type: "system", text: "Re-plan applied. 1 claim softened, 0 dropped." },
  { t: 75, agent: "writer", type: "thought", text: "Narrative spine: Why care → How QC breaks crypto → When → What to do → Roadmap." },
  { t: 78, agent: "writer", type: "note",  text: "Opening line: 'The cryptography securing the internet has an expiry date — we just don't know it yet.'", topic: "Narrative" },
  { t: 82, agent: "data", type: "note",   text: "Migration cost model: $0.6–1.4M for a mid-size enterprise over 3 years.", topic: "Mitigation" },
  { t: 85, agent: "designer", type: "thought", text: "Choosing a dark editorial layout. Charts on 5–7, big-number callouts on 2 and 8." },
  { t: 89, agent: "designer", type: "note", text: "10 slides laid out. Chart on slide 6 uses the capability-vs-time dataset.", topic: "Design" },
  { t: 93, agent: "synth", type: "system", text: "All upstream artifacts approved. Assembling deck.pptx…" },
  { t: 97, agent: "synth", type: "note",  text: "Embedded 14 citations. Deck ready for review.", topic: "Output" },
  { t: 99, agent: "synth", type: "system", text: "✓ quantum-cryptography-impact.pptx generated — 10 slides, 14 sources." },
];

/* ---------- Workspace notes (grouped) ---------- */
export const WORKSPACE: WorkspaceGroup[] = [
  { topic: "Threat timeline", agent: "web", notes: [
    "~20M noisy qubits and ~8 hours would factor RSA-2048 (Gidney & Ekerå, 2019).",
    "Median expert estimate: 17–24% chance of a cryptographically-relevant quantum computer by 2034.",
    "Up to 3–5% of today's TLS traffic is exposed to 'harvest-now-decrypt-later' by 2035.",
  ]},
  { topic: "Quantum capability", agent: "data", notes: [
    "Logical-to-physical qubit overhead is roughly 1000:1 with current surface codes.",
    "Largest gate-model machines today: ~1–1.2k physical qubits, error rates ~10⁻³.",
  ]},
  { topic: "Mitigation", agent: "data", notes: [
    "NIST finalized ML-KEM (FIPS 203), ML-DSA (204), SLH-DSA (205) in Aug 2024.",
    "Crypto-agility + hybrid key exchange is the recommended transition path.",
    "Migration cost: $0.6–1.4M for a mid-size enterprise over a 3-year program.",
  ]},
  { topic: "Narrative", agent: "writer", notes: [
    "Frame around Mosca's inequality (X + Y > Z) to make the risk personal to the audience.",
    "Lead with the expiry-date metaphor; close with a 90-day action checklist.",
  ]},
];

/* ---------- Sources / citations ---------- */
export const SOURCES: Source[] = [
  { host: "csrc.nist.gov", title: "Post-Quantum Cryptography Standardization (FIPS 203/204/205)", by: "Web Researcher", verified: true },
  { host: "arxiv.org", title: "How to factor 2048-bit RSA integers in 8 hours using 20M noisy qubits", by: "Web Researcher", verified: true },
  { host: "globalriskinstitute.org", title: "2024 Quantum Threat Timeline Report", by: "Fact-Checker", verified: true },
  { host: "ncsc.gov.uk", title: "Preparing for quantum-safe cryptography", by: "Web Researcher", verified: true },
  { host: "etsi.org", title: "Quantum-Safe Cryptography migration guidance", by: "Web Researcher", verified: true },
  { host: "iacr.org", title: "Mosca: Cybersecurity in an era with quantum computers", by: "Fact-Checker", verified: true },
  { host: "cloudflare.com", title: "The state of the post-quantum internet", by: "Web Researcher", verified: false },
];

/* ---------- The 10 slides ---------- */
export const SLIDES: Slide[] = [
  { n: 1,  kind: "title",  title: "The Quantum Threat to Cryptography", sub: "What every security leader should plan for now", footer: "Prepared by Swarm · 14 sources" },
  { n: 2,  kind: "stat",   title: "Why this matters", stat: "≈ 20M", statSub: "noisy qubits could break RSA-2048 in 8 hours", body: "The asymmetric cryptography behind TLS, VPNs and code-signing rests on problems a large quantum computer can solve." },
  { n: 3,  kind: "bullets",title: "How quantum breaks today's crypto", bullets: ["Shor's algorithm factors integers & solves discrete logs in polynomial time", "RSA, ECDSA and Diffie-Hellman all fall to it", "Symmetric crypto (AES) only loses half its bits — survivable with AES-256", "Hash-based signatures remain quantum-resistant"] },
  { n: 4,  kind: "chart",  title: "When? A probability, not a date", body: "Median expert estimate: 17–24% chance of a cryptographically-relevant quantum computer by 2034.", chart: "dist" },
  { n: 5,  kind: "chart",  title: "Capability vs. requirement over time", body: "Physical qubit counts are rising; the line to watch is logical, error-corrected qubits.", chart: "line" },
  { n: 6,  kind: "bullets",title: "Harvest now, decrypt later", bullets: ["Adversaries can record encrypted traffic today and decrypt it once QC arrives", "Any secret with a shelf-life beyond ~2032 is already at risk", "Up to 3–5% of TLS traffic is exposed under conservative models"] },
  { n: 7,  kind: "chart",  title: "Mosca's inequality", body: "If (migration time X + data shelf-life Y) > time to quantum Z, you are already exposed.", chart: "bars" },
  { n: 8,  kind: "stat",   title: "The standards are ready", stat: "3", statSub: "NIST PQC standards finalized Aug 2024", body: "ML-KEM (FIPS 203), ML-DSA (204) and SLH-DSA (205) give us drop-in quantum-safe primitives." },
  { n: 9,  kind: "bullets",title: "A pragmatic migration path", bullets: ["Inventory: find every use of public-key crypto", "Adopt crypto-agility so algorithms can be swapped", "Deploy hybrid key exchange (classical + PQC) now", "Prioritize long-lived secrets and code-signing keys"] },
  { n: 10, kind: "close",  title: "The next 90 days", bullets: ["Commission a cryptographic asset inventory", "Pilot hybrid TLS on one external service", "Brief the board using Mosca's inequality"], footer: "quantum-cryptography-impact.pptx" },
];

/* ---------- Project history / sessions ---------- */
export const HISTORY: Project[] = [
  { id: "p1", title: "Impact of quantum computing on cryptography", fmt: "PowerPoint", fmtIcon: "layers", status: "running", date: "30 May 2026", agents: 7, accent: "var(--blue)",
    cost: 0.62, tokIn: 840000, tokOut: 120000, searches: 23, duration: "3:04", words: 1240, sourcesN: 14, kind: "pptx",
    summary: "A 10-slide deck on the quantum threat to cryptography, framed for a security-leadership audience.", goal: "Research the impact of quantum computing on cryptography and produce a 10-slide PowerPoint." },
  { id: "p2", title: "2026 state of AI agent frameworks", fmt: "PDF Report", fmtIcon: "file-text", status: "complete", date: "27 May 2026", agents: 6, accent: "var(--purple)",
    cost: 1.84, tokIn: 1600000, tokOut: 240000, searches: 41, duration: "7:12", words: 4200, sourcesN: 22, kind: "doc",
    summary: "A long-form report comparing orchestration frameworks across capability, ergonomics and cost.", goal: "Survey the 2026 landscape of AI agent frameworks and write a sectioned PDF report." },
  { id: "p3", title: "Competitive teardown — vector databases", fmt: "DOCX", fmtIcon: "file-text", status: "complete", date: "21 May 2026", agents: 5, accent: "var(--cyan)",
    cost: 1.12, tokIn: 1100000, tokOut: 180000, searches: 28, duration: "5:40", words: 3100, sourcesN: 16, kind: "doc",
    summary: "A side-by-side teardown of the leading vector databases with a recommendation matrix.", goal: "Produce a competitive teardown of vector databases as an editable DOCX." },
  { id: "p4", title: "GTM narrative for developer-tools launch", fmt: "Blog Post", fmtIcon: "edit", status: "complete", date: "14 May 2026", agents: 4, accent: "var(--blue)",
    cost: 0.58, tokIn: 520000, tokOut: 90000, searches: 14, duration: "3:20", words: 1450, sourcesN: 9, kind: "doc",
    summary: "A web-ready launch narrative with a sharp hook and three proof points.", goal: "Draft a go-to-market blog post for a developer-tools launch." },
  { id: "p5", title: "Renewable grid storage — market scan", fmt: "Exec Summary", fmtIcon: "file-source", status: "failed", date: "9 May 2026", agents: 6, accent: "var(--st-error)",
    cost: 0.21, tokIn: 240000, tokOut: 20000, searches: 6, duration: "1:10", words: 0, sourcesN: 4, kind: "doc",
    summary: "Synthesis failed — a chart dataset was incomplete. Findings preserved in the workspace.", goal: "Scan the grid-storage market and produce a one-page executive summary." },
  { id: "p6", title: "Regulatory landscape — stablecoins 2026", fmt: "Markdown", fmtIcon: "file-text", status: "complete", date: "2 May 2026", agents: 5, accent: "var(--cyan)",
    cost: 0.74, tokIn: 680000, tokOut: 110000, searches: 18, duration: "4:05", words: 1900, sourcesN: 12, kind: "doc",
    summary: "A structured markdown brief on stablecoin regulation across major jurisdictions.", goal: "Summarize the 2026 regulatory landscape for stablecoins as markdown." },
];

/* ---------- API usage & cost (dashboard) ---------- */
export const USAGE: Usage = {
  monthSpend: 42.8, monthBudget: 100, lastMonth: 36.2,
  totals: { tokens: 18.4, searches: 312, projects: 24, requests: 1284 },
  deltas: { spend: +18, tokens: +12, searches: +9, projects: +4 },
  spendSeries: [0.9, 1.2, 0.7, 1.6, 2.1, 1.1, 0.4, 1.8, 2.4, 1.9, 1.3, 0.8, 1.7, 2.9, 2.2, 1.4, 0.6, 1.1, 2.6, 3.1, 2.3, 1.5, 0.9, 1.2, 2.7, 3.4, 2.1, 1.6, 2.8, 3.0],
  byModel: [
    { name: "Claude Sonnet 4.5", note: "orchestrator + agents", cost: 28.4, color: "var(--blue)" },
    { name: "Claude Haiku 4", note: "routing + subtasks", cost: 4.2, color: "var(--purple)" },
    { name: "Brave Search API", note: "live retrieval", cost: 8.1, color: "var(--cyan)" },
    { name: "Voyage embeddings", note: "workspace recall", cost: 2.1, color: "var(--st-done)" },
  ],
  byAgent: [
    { name: "Synthesis Agent", cost: 9.6, color: "var(--accent)" },
    { name: "Web Researcher", cost: 8.9, color: "var(--blue)" },
    { name: "Lead Researcher", cost: 7.1, color: "var(--purple)" },
    { name: "Content Writer", cost: 6.2, color: "var(--blue)" },
    { name: "Data Analyst", cost: 4.8, color: "var(--cyan)" },
    { name: "Fact-Checker", cost: 3.9, color: "var(--st-done)" },
    { name: "Presentation Designer", cost: 2.3, color: "var(--purple)" },
  ],
};

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
