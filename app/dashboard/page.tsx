"use client";
/* ============================================================
   SWARM — Usage & analytics dashboard, standalone route
   ============================================================ */
import { useState, useEffect, useCallback, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, Card, StatusDot, Segmented } from "../../components/swarm/ui";
import { Sidebar, TopBar } from "../../components/swarm/Shell";
import { FORMATS, type ProjectStatus } from "../../components/swarm/data";

/* ---- Dashboard for free architecture: focus on usage metrics, not costs ---- */

interface Usage {
  periodDays: number;
  totals: { tokens: number; tokensIn: number; tokensOut: number; searches: number; projects: number; activeProjects: number; requests: number };
  deltas: { tokens: number; searches: number; requests: number; projects: number; activeProjects: number };
  dailyProjects: number[];
  usageByFormat: { format: string; projects: number; tokens: number }[];
  agentRoles: { role: string; count: number }[];
}
interface ApiProject { id: string; title: string; format: string; status: string; tokensIn: number; tokensOut: number; searches: number; agentsCount: number }
interface UsageRow { id: string; title: string; fmtIcon: string; accent: string; status: ProjectStatus; tokIn: number; tokOut: number; searches: number; agents: number }

const STATUS_MAP: Record<string, ProjectStatus> = { Draft: "running", Running: "running", Complete: "complete", Failed: "failed" };

function toUsageRow(row: ApiProject): UsageRow {
  const fmt = FORMATS.find((f) => f.id === row.format);
  return {
    id: row.id, title: row.title, fmtIcon: fmt?.icon || "file-text", accent: "var(--accent)",
    status: STATUS_MAP[row.status] || "running", tokIn: row.tokensIn, tokOut: row.tokensOut, searches: row.searches, agents: row.agentsCount,
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

function ActivityArea({ data, color = "var(--accent)" }: { data: number[]; color?: string }) {
  const W = 640, H = 170, pad = 8;
  const max = Math.max(...data, 1) * 1.15;
  const step = (W - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 170, display: "block" }}>
      <defs>
        <linearGradient id="activitygrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="var(--border-soft)" strokeWidth="1" />)}
      <path d={area} fill="url(#activitygrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color} />
    </svg>
  );
}

function Delta({ v }: { v: number }) {
  const up = v >= 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 600, color: up ? "var(--st-done)" : "var(--st-error)" }}>
      <Icon name={up ? "arrow-up" : "arrow-down"} size={11} /> {Math.abs(v)}%
    </span>
  );
}

function Kpi({ label, value, unit, delta, children }: { label: string; value: ReactNode; unit?: string; delta?: number; children?: ReactNode }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="eyebrow">{label}</span>
        {delta != null && <Delta v={delta} />}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, marginTop: 10 }}>
        <span className="tabular" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.6px", color: "var(--text)" }}>{value}</span>
        {unit && <span className="muted" style={{ fontSize: 13, marginBottom: 4 }}>{unit}</span>}
      </div>
      {children}
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
    r.setAttribute("data-density", t.density);
    r.style.setProperty("--mo", String((t.motion ?? 60) / 100));
  }, [t.theme, t.accent, t.density, t.motion]);

  const [period, setPeriod] = useState(30);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const HSTATUS: Record<string, [string, string]> = { running: ["Running", "working"], complete: ["Complete", "done"], failed: ["Failed", "error"] };
  const backHome = () => router.push("/");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.all([
      fetch(`/api/usage?days=${period}`, { signal: controller.signal }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/projects?days=${period}`, { signal: controller.signal }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([u, projectRows]: [Usage | null, ApiProject[]]) => {
        if (!active) return;
        setUsage(u);
        setRows(projectRows.map(toUsageRow));
      })
      .catch((error) => { if (active && error.name !== "AbortError") { setUsage(null); setRows([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [period]);

  if (loading || !usage) {
    return (
      <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
        <Sidebar view="dashboard" activeSession={null}
          onNew={backHome} onGo={({ view }) => router.push(SIDEBAR_ROUTES[view] || "/")} onOpenSession={backHome} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <TopBar stages={null} stage="dashboard" reached={["dashboard"]} onJump={() => {}} status={null} title="Usage & Analytics" theme={t.theme} onTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")} />
          <div style={{ padding: "32px 24px" }}>
            <Card style={{ padding: 40, textAlign: "center" }}>
              <p className="muted" style={{ fontSize: 13.5 }}>Loading usage…</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const u = usage;
  const periodLabel = `last ${u.periodDays} days`;

  function changePeriod(days: number) {
    setLoading(true);
    setPeriod(days);
  }

  function exportCsv() {
    const header = ["Project", "Status", "Tokens", "Searches", "Agents"];
    const csvRows = rows.map((row) => [row.title, HSTATUS[row.status][0], row.tokIn + row.tokOut, row.searches, row.agents]);
    const csv = [header, ...csvRows]
      .map((cells) => cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `swarm-usage-${u.periodDays}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
      <Sidebar view="dashboard" activeSession={null}
        onNew={backHome} onGo={({ view }) => router.push(SIDEBAR_ROUTES[view] || "/")} onOpenSession={backHome} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar stages={null} stage="dashboard" reached={["dashboard"]} onJump={() => {}} status={null} title="Usage & Analytics" theme={t.theme} onTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")} />
        <div style={{ overflow: "auto", height: "100%", padding: "32px 24px 48px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 className="h1">Usage &amp; Analytics</h1>
                <p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>API tokens, searches, and request metrics across all projects</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Segmented<number> size="sm" options={[{ value: 7, label: "7d" }, { value: 30, label: "30d" }, { value: 90, label: "90d" }]} value={period} onChange={changePeriod} />
                <Btn kind="secondary" size="sm" icon="download" onClick={exportCsv}>Export CSV</Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 }}>
              <Kpi label="Tokens used" value={(u.totals.tokens / 1e6).toFixed(2)} unit="M" delta={u.deltas.tokens}>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>{(u.totals.tokensIn / 1e6).toFixed(2)}M in · {(u.totals.tokensOut / 1e6).toFixed(2)}M out</div>
              </Kpi>
              <Kpi label="Web searches" value={u.totals.searches} delta={u.deltas.searches}>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>across {u.totals.projects} project{u.totals.projects === 1 ? "" : "s"} · {periodLabel}</div>
              </Kpi>
              <Kpi label="Agent events" value={u.totals.requests.toLocaleString()} delta={u.deltas.requests}>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>recorded activity · {periodLabel}</div>
              </Kpi>
              <Kpi label="Active projects" value={u.totals.activeProjects} delta={u.deltas.activeProjects}>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>{u.totals.projects} total · {periodLabel}</div>
              </Kpi>
            </div>

            <Card style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <span className="eyebrow">Daily projects · {periodLabel}</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                    <span className="tabular" style={{ fontSize: 22, fontWeight: 700 }}>{u.dailyProjects.reduce((a, b) => a + b, 0)}</span>
                    <Delta v={u.deltas.projects} />
                    <span className="faint" style={{ fontSize: 12 }}>vs previous period</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11.5 }}>
                  <span className="faint">Peak <b className="mono" style={{ color: "var(--text-2)" }}>{Math.max(...u.dailyProjects)}</b></span>
                  <span className="faint">Avg/day <b className="mono" style={{ color: "var(--text-2)" }}>{(u.dailyProjects.reduce((a, b) => a + b, 0) / u.dailyProjects.length).toFixed(1)}</b></span>
                </div>
              </div>
              <ActivityArea data={u.dailyProjects} />
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>
              <Card style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span className="h4">Usage by format</span>
                </div>
                {u.usageByFormat.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {u.usageByFormat.slice(0, 5).map((item) => (
                      <div key={item.format} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="faint" style={{ fontSize: 12 }}>{FORMATS.find((format) => format.id === item.format)?.label || item.format}</span>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{item.projects} project{item.projects === 1 ? "" : "s"} · {(item.tokens / 1e6).toFixed(2)}M</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted" style={{ fontSize: 13 }}>No data yet — run projects to see usage breakdown.</p>
                )}
              </Card>
              <Card style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span className="h4">Agent roles</span>
                </div>
                {u.agentRoles.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {u.agentRoles.slice(0, 5).map((item) => (
                      <div key={item.role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="faint" style={{ fontSize: 12 }}>{item.role}</span>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted" style={{ fontSize: 13 }}>No data yet — run projects to see agent breakdown.</p>
                )}
              </Card>
            </div>

            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <span className="h4">Usage by project</span>
                <div style={{ flex: 1 }} />
                <span className="faint" style={{ fontSize: 12 }}>{rows.length} recent run{rows.length === 1 ? "" : "s"}</span>
              </div>
              {rows.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <p className="muted" style={{ fontSize: 13.5 }}>No projects yet.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2.4fr) 1fr 1fr 1fr 0.8fr", padding: "10px 20px", borderBottom: "1px solid var(--border-soft)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--faint)" }}>
                    <span>Project</span><span>Status</span><span style={{ textAlign: "right" }}>Tokens</span><span style={{ textAlign: "right" }}>Searches</span><span style={{ textAlign: "right" }}>Agents</span>
                  </div>
                  {rows.map((p, i) => {
                    const [lab, dot] = HSTATUS[p.status];
                    return (
                      <button key={p.id} onClick={backHome} style={{
                        display: "grid", gridTemplateColumns: "minmax(0,2.4fr) 1fr 1fr 1fr 0.8fr", alignItems: "center", width: "100%",
                        padding: "12px 20px", border: "none", borderTop: i ? "1px solid var(--border-soft)" : "none", background: "transparent",
                        cursor: "pointer", textAlign: "left", fontFamily: "var(--font)",
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--elevated)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", color: p.accent }}><Icon name={p.fmtIcon} size={13} /></span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</span>
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}><StatusDot status={dot} size={6} />{lab}</span>
                        <span className="mono" style={{ fontSize: 12.5, color: "var(--text-2)", textAlign: "right" }}>{((p.tokIn + p.tokOut) / 1e6).toFixed(2)}M</span>
                        <span className="mono" style={{ fontSize: 12.5, color: "var(--text-2)", textAlign: "right" }}>{p.searches}</span>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textAlign: "right" }}>{p.agents}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
