"use client";
/* ============================================================
   SWARM — Projects (History), standalone route
   ============================================================ */
import { useState, useEffect, useCallback, useSyncExternalStore, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, IconBtn, Badge, Card, Segmented, StatusDot, Empty } from "../../components/swarm/ui";
import { Sidebar, TopBar } from "../../components/swarm/Shell";
import { FORMATS, type Project, type ProjectStatus } from "../../components/swarm/data";

interface ApiProject {
  id: string; title: string; goal: string; format: string; status: string;
  cost: number; tokensIn: number; tokensOut: number; searches: number;
  durationSeconds: number | null; wordCount: number | null; summary: string | null;
  createdAt: string; agentsCount: number; sourcesCount: number;
}

const STATUS_MAP: Record<string, ProjectStatus> = { Draft: "running", Running: "running", Complete: "complete", Failed: "failed" };

function toDisplayProject(row: ApiProject): Project {
  const fmt = FORMATS.find((f) => f.id === row.format);
  const mins = row.durationSeconds != null ? Math.floor(row.durationSeconds / 60) : null;
  const secs = row.durationSeconds != null ? row.durationSeconds % 60 : null;
  return {
    id: row.id,
    title: row.title,
    fmt: fmt?.label || row.format,
    fmtIcon: fmt?.icon || "file-text",
    status: STATUS_MAP[row.status] || "running",
    date: new Date(row.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    agents: row.agentsCount,
    accent: "var(--accent)",
    cost: row.cost,
    tokIn: row.tokensIn,
    tokOut: row.tokensOut,
    searches: row.searches,
    duration: mins != null && secs != null ? `${mins}:${String(secs).padStart(2, "0")}` : "—",
    words: row.wordCount ?? 0,
    sourcesN: row.sourcesCount,
    kind: row.format === "pptx" ? "pptx" : "doc",
    summary: row.summary || "",
    goal: row.goal,
  };
}

/* ---- appearance tweaks, persisted to localStorage (mirrors SwarmApp) ---- */
interface Tweaks { theme: string; accent: string; density: string; motion: number }
const TWEAK_DEFAULTS: Tweaks = { theme: "dark", accent: "blue", density: "comfortable", motion: 60 };
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

const SIDEBAR_ROUTES: Record<string, string> = { settings: "/settings", dashboard: "/dashboard", history: "/projects", skills: "/skills" };

const HSTATUS: Record<string, { label: string; color: string; dot: string }> = {
  running:  { label: "Running", color: "var(--st-working)", dot: "working" },
  complete: { label: "Complete", color: "var(--st-done)", dot: "done" },
  failed:   { label: "Failed", color: "var(--st-error)", dot: "error" },
};

function FormatThumb({ p, h }: { p: Project; h: boolean }) {
  return (
    <div style={{ width: "100%", aspectRatio: "16/10", borderRadius: "var(--r-sm)", overflow: "hidden", position: "relative", background: "linear-gradient(150deg, #101015, #0a0a0c)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
      <div style={{ position: "absolute", top: "-30%", right: "-15%", width: "55%", height: "90%", background: `radial-gradient(circle, color-mix(in oklab, ${p.accent} 35%, transparent), transparent 65%)` }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: p.accent }}>
        <Icon name={p.fmtIcon} size={26} />
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{p.fmt}</span>
      </div>
      {h && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Btn kind="glass" size="sm" icon="eye">Open</Btn>
      </div>}
    </div>
  );
}

function HistoryCard({ p, onOpen }: { p: Project; onOpen: (id: string) => void }) {
  const [h, setH] = useState(false);
  const st = HSTATUS[p.status];
  return (
    <Card hover onClick={() => onOpen(p.id)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ padding: 12 }}>
      <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
        <FormatThumb p={p} h={h} />
      </div>
      <div style={{ padding: "12px 4px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: st.color }}><StatusDot status={st.dot} size={6} />{st.label}</span>
          <span className="faint" style={{ fontSize: 11, marginLeft: "auto", whiteSpace: "nowrap" }}>{p.date}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.title}</div>
        <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, minHeight: 32, marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.goal}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <Badge tone="neutral" icon={p.fmtIcon}>{p.fmt}</Badge>
          <span className="faint" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="users" size={12} color="var(--faint)" />{p.agents}</span>
          <div style={{ flex: 1 }} />
          <IconBtn name="download" size={28} title="Download" />
          <IconBtn name="duplicate" size={28} title="Clone & re-run" />
          <IconBtn name="more-horizontal" size={28} title="More" />
        </div>
      </div>
    </Card>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
    r.setAttribute("data-density", t.density);
    r.style.setProperty("--mo", String((t.motion ?? 60) / 100));
  }, [t.theme, t.accent, t.density, t.motion]);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [previewEmpty, setPreviewEmpty] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const backHome = () => router.push("/");
  const openProject = (id: string) => router.push(`/projects/${id}`);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: ApiProject[]) => setProjects(rows.map(toDisplayProject)))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const runningCount = projects.filter((p) => p.status === "running").length;
  const showEmpty = previewEmpty || (!loading && projects.length === 0);

  return (
    <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
      <Sidebar view="history" activeSession={null}
        onNew={backHome} onGo={({ view }) => router.push(SIDEBAR_ROUTES[view] || "/")} onOpenSession={openProject} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar stages={null} stage="history" reached={["history"]} onJump={() => {}} status={null} title="Projects" theme={t.theme} onTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")} />
        <div style={{ overflow: "auto", height: "100%", padding: "32px 24px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 className="h1">Projects</h1>
                <p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>
                  {loading ? "Loading…" : `${projects.length} project${projects.length === 1 ? "" : "s"}${runningCount ? ` · ${runningCount} running` : ""}`}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Segmented<"grid" | "list"> size="sm" options={[{ value: "grid", label: "Grid", icon: "grid" }, { value: "list", label: "List", icon: "list" }]} value={view} onChange={setView} />
                <Btn kind="ghost" size="sm" onClick={() => setPreviewEmpty(!previewEmpty)}>{previewEmpty ? "Show projects" : "Preview empty"}</Btn>
                <Btn kind="primary" icon="plus" onClick={backHome}>New project</Btn>
              </div>
            </div>

            {loading ? (
              <Card style={{ padding: 40, textAlign: "center" }}>
                <p className="muted" style={{ fontSize: 13.5 }}>Loading projects…</p>
              </Card>
            ) : showEmpty ? (
              <Card style={{ padding: 0 }}>
                <Empty icon="folder" title="No projects yet" body="Set a research goal and the swarm will assemble a team, do the work, and hand you a finished file." action={<Btn kind="primary" icon="wand" onClick={backHome}>Start your first project</Btn>} />
              </Card>
            ) : view === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {projects.map((p) => <HistoryCard key={p.id} p={p} onOpen={openProject} />)}
              </div>
            ) : (
              <Card style={{ padding: 0, overflow: "hidden" }}>
                {projects.map((p, i) => {
                  const st = HSTATUS[p.status];
                  return (
                    <div key={p.id} onClick={() => openProject(p.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderTop: i ? "1px solid var(--border-soft)" : "none", cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--elevated)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <span style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", color: p.accent }}><Icon name={p.fmtIcon} size={16} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                        <div className="faint" style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.goal}</div>
                        <div className="faint" style={{ fontSize: 11 }}>{p.fmt} · {p.agents} agents · {p.date}</div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: st.color }}><StatusDot status={st.dot} size={6} />{st.label}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <IconBtn name="download" size={30} title="Download" />
                        <IconBtn name="duplicate" size={30} title="Clone & re-run" />
                        <IconBtn name="trash" size={30} title="Delete" />
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
