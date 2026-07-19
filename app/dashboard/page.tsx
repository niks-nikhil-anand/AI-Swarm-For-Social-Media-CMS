"use client";

import { useState, useEffect, useCallback, useSyncExternalStore, type CSSProperties } from "react";
import { Sidebar, TopBar } from "../../components/swarm/Shell";

import { DashboardOverview } from "../../components/swarm/DashboardOverview";
import {
  AnalyticsApiView,
  ApprovalsApiView,
  CalendarApiView,
  ContentQueueApiView,
  PublishedPostsApiView,
  ResearchApiView,
  SettingsApiView,
  SourcesApiView,
  WorkflowsApiView,
} from "../../components/swarm/ApiBackedViews";

interface Tweaks { theme: string; accent: string; density: string; motion: number }
const TWEAK_DEFAULTS: Tweaks = { theme: "dark", accent: "blue", density: "comfortable", motion: 60 };

function readTweaks(defaults: Tweaks): Tweaks {
  try {
    const raw = localStorage.getItem("swarm-tweaks");
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}

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

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  queue: 'Content Queue',
  research: 'Research',
  approvals: 'Approvals',
  calendar: 'Calendar',
  published: 'Published Posts',
  analytics: 'Analytics',
  sources: 'Sources',
  workflows: 'Workflows',
  settings: 'Settings'
};

export default function DashboardPage() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState("dashboard");
  const [isPaused, setIsPaused] = useState(false);

  // Sync tweaks values to document elements
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
    r.setAttribute("data-density", t.density);
    r.style.setProperty("--mo", String((t.motion ?? 60) / 100));
  }, [t.theme, t.accent, t.density, t.motion]);

  const toggleTheme = () => {
    setTweak("theme", t.theme === "dark" ? "light" : "dark");
  };

  const handleGo = ({ view: nextView }: { view: string }) => {
    setView(nextView);
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
      <Sidebar 
        view={view} 
        activeSession={null}
        onNew={() => setView("dashboard")} 
        onGo={handleGo} 
        onOpenSession={() => {}} 
      />
      
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar
          stages={null} 
          stage={view} 
          reached={[view]} 
          onJump={() => {}} 
          status={null} 
          title={TITLES[view] || 'Dashboard'} 
          theme={t.theme} 
          onTheme={toggleTheme}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
        />

        {/* Warning Banner when Paused */}
        {isPaused && (
          <div style={{ flex: "none", background: "var(--redbg)", borderBottom: "1px solid var(--red)", color: "var(--red)", padding: "9px 20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", fontWeight: 500 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--red)" }}></span>
            Publishing is paused — all scheduled posts are held. Nothing will be published until you resume.
            <div style={{ flex: 1 }}></div>
            <button onClick={() => setIsPaused(false)} style={{ font: "inherit", fontSize: "11.5px", fontWeight: 600, padding: "5px 11px", borderRadius: "6px", border: "1px solid var(--red)", background: "transparent", color: "var(--red)", cursor: "pointer" }}>Resume publishing</button>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: "18px 20px 32px" }}>
          {view === "dashboard" && <DashboardOverview theme={t.theme} isPaused={isPaused} onGoPage={setView} />}
          {view === "queue" && <ContentQueueApiView />}
          {view === "research" && <ResearchApiView />}
          {view === "approvals" && <ApprovalsApiView />}
          {view === "calendar" && <CalendarApiView />}
          {view === "published" && <PublishedPostsApiView />}
          {view === "analytics" && <AnalyticsApiView />}
          {view === "sources" && <SourcesApiView />}
          {view === "workflows" && <WorkflowsApiView />}
          {view === "settings" && <SettingsApiView />}
        </div>
      </main>
    </div>
  );
}
