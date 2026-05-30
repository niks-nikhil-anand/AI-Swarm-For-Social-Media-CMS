"use client";
/* ============================================================
   SWARM — App root + state machine + appearance tweaks
   ============================================================ */
import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { Icon } from "./ui";
import { Sidebar, TopBar } from "./Shell";
import { Login } from "./Login";
import { Define } from "./Define";
import { Roles } from "./Roles";
import { Run } from "./Run";
import { Output } from "./Output";
import { History, Settings } from "./Pages";
import { Dashboard } from "./Dashboard";
import { SessionDetail } from "./SessionDetail";
import type { Stage } from "./ui";

const STAGES: Stage[] = [
  { key: "define", label: "Define" },
  { key: "roles", label: "Roles" },
  { key: "run", label: "Run" },
  { key: "output", label: "Output" },
  { key: "history", label: "History" },
];
const STAGE_STATUS: Record<string, string> = { define: "drafting", roles: "awaiting", run: "running", output: "complete" };

interface Tweaks { theme: string; accent: string; density: string; motion: number }
const TWEAK_DEFAULTS: Tweaks = { theme: "dark", accent: "blue", density: "comfortable", motion: 60 };

/* ---- appearance tweaks, persisted to localStorage ---- */
function readTweaks(defaults: Tweaks): Tweaks {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem("swarm-tweaks");
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}
function useTweaks(defaults: Tweaks): [Tweaks, (k: keyof Tweaks, v: string | number) => void] {
  const [t, setT] = useState<Tweaks>(() => readTweaks(defaults));
  const setTweak = useCallback((k: keyof Tweaks, v: string | number) => {
    setT((prev) => {
      const next = { ...prev, [k]: v };
      try { localStorage.setItem("swarm-tweaks", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);
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
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState("define");
  const [, setFlowScreen] = useState("define");
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [reached, setReached] = useState<string[]>(["define", "history"]);
  const [runLayout, setRunLayout] = useState<"split" | "graph" | "logs">("split");
  const [graphLayout, setGraphLayout] = useState<"layered" | "vertical" | "radial">("layered");
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  function reach(...keys: string[]) { setReached((p) => Array.from(new Set([...p, ...keys]))); }
  const FLOW = ["define", "roles", "run", "output"];
  function go(key: string) { setScreen(key); if (FLOW.includes(key)) setFlowScreen(key); }

  function onPropose() { reach("roles"); go("roles"); pushToast({ icon: "wand", title: "Team proposed", body: "7 specialist agents are ready for your approval." }); }
  function onLaunch() { reach("run", "output"); go("run"); pushToast({ icon: "play", title: "Swarm launched", body: "7 agents are now researching live." }); }
  function onComplete() { reach("output"); go("output"); pushToast({ icon: "check-circle-fill", tone: "success", title: "Deck ready", body: "quantum-cryptography-impact.pptx · 10 slides." }); }
  function onRerun() { go("roles"); pushToast({ icon: "reload", title: "Cloned to Roles", body: "Adjust the team and launch again." }); }
  function onNew() { setReached(["define", "history"]); go("define"); }
  function openLive() { reach("run", "output"); setScreen("run"); setFlowScreen("run"); }
  function openSession(id: string) {
    if (id === "p1") { openLive(); return; }
    setActiveSession(id); setScreen("session");
  }

  if (!authed) return <Login onAuth={() => { setAuthed(true); pushToast({ icon: "check-circle-fill", tone: "success", title: "Signed in", body: "Welcome back, Avery." }); }} />;

  const PROJECT_TITLE = "Quantum computing × cryptography";
  const TITLES: Record<string, string> = { history: "Projects", session: "Projects", dashboard: "Usage & cost", settings: "Settings" };
  const topTitle = FLOW.includes(screen) ? PROJECT_TITLE : (TITLES[screen] || "Swarm");
  const status = STAGE_STATUS[screen] || null;
  const showStepper = ["define", "roles", "run", "output", "history"].includes(screen);
  const sidebarView = FLOW.includes(screen) ? "flow" : screen;

  function jump(key: string) {
    if (key === "history") return go("history");
    if (reached.includes(key)) go(key);
  }

  return (
    <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
      <Sidebar view={sidebarView} activeSession={activeSession}
        onNew={onNew} onGo={({ view }) => go(view)} onOpenSession={openSession} />
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
          {screen === "run" && <Run onComplete={onComplete} runLayout={runLayout} setRunLayout={setRunLayout} graphLayout={graphLayout} setGraphLayout={setGraphLayout} motion={t.motion} />}
          {screen === "output" && <Output onRerun={onRerun} />}
          {screen === "history" && <History onNew={onNew} onOpen={openSession} />}
          {screen === "dashboard" && <Dashboard onOpenSession={openSession} />}
          {screen === "session" && <SessionDetail id={activeSession} onBack={() => go("history")} onOpenLive={openLive} onRerun={onRerun} />}
          {screen === "settings" && <Settings theme={t.theme} onTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")} accent={t.accent} onAccent={(a) => setTweak("accent", a)} />}
        </div>
      </main>

      <Toasts items={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
    </div>
  );
}
