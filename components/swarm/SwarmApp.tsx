"use client";
/* ============================================================
   SWARM — App root + state machine + appearance tweaks
   ============================================================ */
import { useState, useEffect, useCallback, useSyncExternalStore, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./ui";
import { Sidebar, TopBar } from "./Shell";
import { Define, type ProjectBrief } from "./Define";
import { Roles } from "./Roles";
import { Run } from "./Run";
import { Output } from "./Output";
import type { Stage } from "./ui";
import type { Agent } from "./data";

const PROJECT_ID_KEY = "swarm-active-project";

const STAGES: Stage[] = [
  { key: "define", label: "Define" },
  { key: "roles", label: "Roles" },
  { key: "run", label: "Run" },
  { key: "output", label: "Output" },
  { key: "history", label: "History" },
];
const STAGE_STATUS: Record<string, string> = { define: "drafting", roles: "awaiting", run: "running", output: "complete" };
const SIDEBAR_ROUTES: Record<string, string> = { settings: "/settings", dashboard: "/dashboard", history: "/projects", skills: "/skills" };
const DEFAULT_BRIEF: ProjectBrief = {
  goal: "Research the impact of quantum computing on cryptography and produce a 10-slide PowerPoint for a security leadership audience.",
  format: "pptx",
  tone: "Executive",
  length: "10 slides",
  audience: "CISO, security leadership, board",
  sources: "NIST, NCSC",
  instructions: "Prefer probability framing over fixed dates. Cite every quantitative claim.",
};

function titleFromGoal(goal: string): string {
  const clean = goal.replace(/\s+/g, " ").trim();
  const firstSentence = clean.split(/[.!?](?:\s|$)/)[0] || clean;
  return firstSentence.length <= 72 ? firstSentence : `${firstSentence.slice(0, 69).trimEnd()}…`;
}

interface Tweaks { theme: string; accent: string; density: string; motion: number }
const TWEAK_DEFAULTS: Tweaks = { theme: "dark", accent: "blue", density: "comfortable", motion: 60 };

/* ---- appearance tweaks, persisted to localStorage ---- */
function readTweaks(defaults: Tweaks): Tweaks {
  try {
    const raw = localStorage.getItem("swarm-tweaks");
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}
// useSyncExternalStore returns `getServerSnapshot` for both the server render
// and the initial client hydration pass, then resolves to the real
// client-only value synchronously before paint — this is what avoids the
// hydration mismatch without a setState-in-effect.
const tweaksListeners = new Set<() => void>();
let tweaksCache: Tweaks | null = null;
function subscribeTweaks(cb: () => void) {
  tweaksListeners.add(cb);
  return () => { tweaksListeners.delete(cb); };
}
function getTweaksSnapshot(defaults: Tweaks): Tweaks {
  if (!tweaksCache) tweaksCache = readTweaks(defaults);
  return tweaksCache;
}
function useTweaks(defaults: Tweaks): [Tweaks, (k: keyof Tweaks, v: string | number) => void] {
  const t = useSyncExternalStore(subscribeTweaks, () => getTweaksSnapshot(defaults), () => defaults);
  const setTweak = useCallback((k: keyof Tweaks, v: string | number) => {
    const next = { ...getTweaksSnapshot(defaults), [k]: v };
    try { localStorage.setItem("swarm-tweaks", JSON.stringify(next)); } catch { /* ignore */ }
    tweaksCache = next;
    tweaksListeners.forEach((l) => l());
  }, [defaults]);
  return [t, setTweak];
}

interface Toast { id: number; icon?: string; tone?: string; title: string; body?: string }

function Toasts({ items, onDismiss }: { items: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, width: 340, maxWidth: "92vw" }}>
      {items.map((t) => (
        <div key={t.id} className="glass-strong rise" style={{ display: "flex", gap: 11, padding: "12px 14px", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-lg)", alignItems: "flex-start" }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.tone === "success" ? "var(--st-done-soft)" : "var(--accent-soft)", color: t.tone === "success" ? "var(--st-done)" : "var(--accent)" }}>
            <Icon name={t.icon || "zap"} size={14} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{t.title}</div>
            {t.body && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{t.body}</div>}
          </div>
          <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--faint)", padding: 2 }}><Icon name="x" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export default function SwarmApp() {
  const router = useRouter();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState("define");
  const [, setFlowScreen] = useState("define");
  const [reached, setReached] = useState<string[]>(["define", "history"]);
  const [runLayout, setRunLayout] = useState<"split" | "graph" | "logs">("split");
  const [graphLayout, setGraphLayout] = useState<"layered" | "vertical" | "radial">("layered");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [brief, setBrief] = useState<ProjectBrief>(DEFAULT_BRIEF);

  // apply tweaks to document
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
    r.setAttribute("data-density", t.density);
    r.style.setProperty("--mo", String((t.motion ?? 60) / 100));
  }, [t.theme, t.accent, t.density, t.motion]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, ...toast }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4200);
  }, []);

  // Resume an in-flight run after a refresh: prefer the sessionStorage marker,
  // fall back to the newest Running project in the DB.
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      let stored: string | null = null;
      try { stored = sessionStorage.getItem(PROJECT_ID_KEY); } catch { /* ignore */ }

      try {
        const res = await fetch("/api/projects");
        if (!res.ok || cancelled) return;
        const projects: { id: string; title: string; goal: string; format: string; status: string; agentsCount: number }[] = await res.json();
        const active =
          (stored && projects.find((p) => p.id === stored && (p.status === "Running" || p.status === "Draft"))) ||
          projects.find((p) => p.status === "Running");
        if (!active || cancelled) return;

        setProjectId(active.id);
        setBrief((current) => ({ ...current, goal: active.goal, format: active.format }));
        try { sessionStorage.setItem(PROJECT_ID_KEY, active.id); } catch { /* ignore */ }
        setReached((p) => Array.from(new Set([...p, "roles", "run", "output"])));
        setScreen("run");
        setFlowScreen("run");
        pushToast({ icon: "activity", title: "Run resumed", body: "Reconnected to your project in progress." });
      } catch { /* offline — stay on Define */ }
    }
    hydrate();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reach(...keys: string[]) { setReached((p) => Array.from(new Set([...p, ...keys]))); }
  const FLOW = ["define", "roles", "run", "output"];
  function go(key: string) { setScreen(key); if (FLOW.includes(key)) setFlowScreen(key); }

  function onPropose(nextBrief: ProjectBrief) { setBrief(nextBrief); reach("roles"); go("roles"); pushToast({ icon: "wand", title: "Team proposed", body: "7 specialist agents are ready for your approval." }); }
  function onLaunch(roster: Agent[]) {
    reach("run", "output"); go("run");
    pushToast({ icon: "play", title: "Swarm launched", body: `${roster.length} agents are now researching live.` });
    // Persist the project + frozen team so live search, workflow runs and
    // refreshes have somewhere real to read/write.
    if (!projectId) {
      fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleFromGoal(brief.goal),
          goal: brief.goal,
          format: brief.format,
          agents: roster.map((a) => ({
            id: a.id, name: a.name, short: a.short, icon: a.icon, accent: a.accent,
            role: a.role, why: a.why, deps: a.deps, layer: a.layer,
          })),
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.id) {
            setProjectId(data.id);
            try { sessionStorage.setItem(PROJECT_ID_KEY, data.id); } catch { /* ignore */ }
          }
        })
        .catch(() => { /* unauthenticated or offline — search stays disabled */ });
    }
  }
  function onComplete() {
    reach("output"); go("output");
    pushToast({ icon: "check-circle-fill", tone: "success", title: "Deck ready", body: "quantum-cryptography-impact.pptx · 10 slides." });
    if (projectId) {
      fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Complete" }),
      }).catch(() => { /* offline — status stays Running until next sync */ });
      try { sessionStorage.removeItem(PROJECT_ID_KEY); } catch { /* ignore */ }
    }
  }
  function onRerun() { setProjectId(null); try { sessionStorage.removeItem(PROJECT_ID_KEY); } catch { /* ignore */ } go("roles"); pushToast({ icon: "reload", title: "Cloned to Roles", body: "Adjust the team and launch again." }); }
  function onNew() { setProjectId(null); setBrief(DEFAULT_BRIEF); try { sessionStorage.removeItem(PROJECT_ID_KEY); } catch { /* ignore */ } setReached(["define", "history"]); go("define"); }
  function openSession(id: string) {
    router.push(`/projects/${id}`);
  }

  const PROJECT_TITLE = titleFromGoal(brief.goal);
  const TITLES: Record<string, string> = { session: "Projects" };
  const topTitle = FLOW.includes(screen) ? PROJECT_TITLE : (TITLES[screen] || "Swarm");
  const status = STAGE_STATUS[screen] || null;
  const showStepper = ["define", "roles", "run", "output"].includes(screen);
  const sidebarView = FLOW.includes(screen) ? "flow" : screen;

  function jump(key: string) {
    if (key === "history") return router.push("/projects");
    if (reached.includes(key)) go(key);
  }

  return (
    <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
      <Sidebar view={sidebarView} activeSession={null}
        onNew={onNew} onGo={({ view }) => {
          const route = SIDEBAR_ROUTES[view];
          if (route) router.push(route); else go(view);
        }} onOpenSession={openSession} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar
          stages={showStepper ? STAGES : null}
          stage={screen} reached={reached} onJump={jump}
          status={status} title={topTitle}
          theme={t.theme}
          onTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")}
        />
        <div data-screen-label={`Swarm · ${screen}`} style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {screen === "define" && <Define onPropose={onPropose} />}
          {screen === "roles" && <Roles onLaunch={onLaunch} />}
          {screen === "run" && <Run onComplete={onComplete} runLayout={runLayout} setRunLayout={setRunLayout} graphLayout={graphLayout} setGraphLayout={setGraphLayout} motion={t.motion} projectId={projectId} />}
          {screen === "output" && <Output onRerun={onRerun} />}
        </div>
      </main>

      <Toasts items={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
    </div>
  );
}
