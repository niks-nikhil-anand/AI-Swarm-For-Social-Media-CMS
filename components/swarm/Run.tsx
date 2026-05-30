"use client";
/* ============================================================
   SWARM — Stage 3: Run (live execution dashboard)
   ============================================================ */
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Icon, Btn, IconBtn, Badge, Ring, Bar, StatusPill, StatusDot, Segmented, STATUS } from "./ui";
import { AgentGraph } from "./Graph";
import { AGENTS, TIMELINE, WORKSPACE, type Agent, type AgentStatus, type TimelineEvent } from "./data";

type RunLayout = "split" | "graph" | "logs";
type GraphLayout = "layered" | "vertical" | "radial";

/* ---- simulation helpers ---- */
const BLOCK: Record<string, [number, number]> = { fact: [65, 72] };
function statusFor(a: Agent, clock: number): AgentStatus {
  if (BLOCK[a.id] && clock >= BLOCK[a.id][0] && clock < BLOCK[a.id][1]) return "blocked";
  if (clock < (a.t0 ?? 0)) {
    const depsStarted = a.deps.some((d) => { const da = AGENTS.find((x) => x.id === d); return da && clock >= (da.t0 ?? 0); });
    return depsStarted || a.deps.length === 0 ? "waiting" : "idle";
  }
  if (clock >= (a.t1 ?? 100)) return "done";
  return "working";
}
function progressFor(a: Agent, clock: number) {
  const t0 = a.t0 ?? 0, t1 = a.t1 ?? 100;
  if (clock <= t0) return 0;
  if (clock >= t1) return 100;
  return Math.round(((clock - t0) / (t1 - t0)) * 100);
}
function actionFor(a: Agent, clock: number) {
  let cur = a.actions?.[0] ? a.actions[0][1] : "";
  for (const [t, txt] of a.actions ?? []) { if (clock >= t) cur = txt; }
  if (clock >= (a.t1 ?? 100)) return "Completed";
  if (statusFor(a, clock) === "waiting") return "Waiting for upstream findings";
  if (statusFor(a, clock) === "idle") return "Queued";
  return cur;
}
function fmtElapsed(clock: number) {
  const total = Math.round((clock / 100) * 184);
  const m = Math.floor(total / 60), s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ---- log line ---- */
const LOG_META: Record<string, { icon: string; color: string; label: string }> = {
  thought: { icon: "discussion-circle", color: "var(--muted)", label: "thought" },
  search:  { icon: "search", color: "var(--accent-2)", label: "search" },
  url:     { icon: "globe", color: "var(--st-working)", label: "visited" },
  note:    { icon: "file-text", color: "var(--st-done)", label: "note" },
  handoff: { icon: "git-branch", color: "var(--purple)", label: "handoff" },
  system:  { icon: "zap", color: "var(--faint)", label: "system" },
  warn:    { icon: "alert-triangle", color: "var(--st-blocked)", label: "flag" },
  error:   { icon: "alert-circle", color: "var(--st-error)", label: "error" },
};
function LogLine({ ev }: { ev: TimelineEvent }) {
  const m = LOG_META[ev.type] || LOG_META.system;
  const agent = AGENTS.find((a) => a.id === ev.agent);
  return (
    <div className="rise" style={{ display: "flex", gap: 10, padding: "9px 14px", borderBottom: "1px solid var(--border-soft)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 1 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", color: m.color, flexShrink: 0 }}>
          <Icon name={m.icon} size={12} />
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: agent ? agent.accent : "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flexShrink: 1 }}>{agent ? agent.name : "System"}</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--faint)", flexShrink: 0 }}>{m.label}</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--faint)", marginLeft: "auto", flexShrink: 0 }}>{fmtElapsed(ev.t)}</span>
        </div>
        {ev.type === "search" ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 9px", borderRadius: "var(--r-sm)", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
            <Icon name="search" size={12} color="var(--accent-2)" />
            <span className="mono" style={{ fontSize: 12, color: "var(--accent-2)" }}>{ev.text}</span>
          </div>
        ) : ev.type === "url" ? (
          <a href="#" onClick={(e) => e.preventDefault()} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 9px", borderRadius: "var(--r-sm)", background: "var(--elevated)", border: "1px solid var(--border)", maxWidth: "100%" }}>
            <Icon name="globe" size={12} color="var(--st-working)" />
            <span style={{ fontSize: 12.5, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.url}</span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--faint)" }}>{ev.text}</span>
            <Icon name="external-link" size={11} color="var(--faint)" />
          </a>
        ) : ev.type === "note" ? (
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--st-done)", marginRight: 6, verticalAlign: "middle" }}><Icon name="file-text" size={11} />→ {ev.topic}</span>
            {ev.text}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: ev.type === "warn" ? "var(--st-blocked)" : ev.type === "thought" ? "var(--muted)" : "var(--text-2)", lineHeight: 1.5, fontStyle: ev.type === "thought" ? "italic" : "normal" }}>{ev.text}</div>
        )}
      </div>
    </div>
  );
}

/* ---- agent progress card ---- */
function AgentProgressCard({ agent, status, progress, action, onClick, selected }: {
  agent: Agent; status: AgentStatus; progress: number; action: string; onClick: () => void; selected: boolean;
}) {
  const s = STATUS[status] || STATUS.idle;
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, width: 224, textAlign: "left", cursor: "pointer", fontFamily: "var(--font)",
      padding: 12, borderRadius: "var(--r-md)", background: "var(--surface)",
      border: `1px solid ${selected ? "var(--accent-line)" : "var(--border)"}`,
      boxShadow: status === "working" ? `0 0 16px -4px color-mix(in oklab, ${s.color} 50%, transparent)` : "var(--shadow-sm)",
      transition: "box-shadow 200ms, border-color 160ms",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", color: agent.accent, flexShrink: 0 }}><Icon name={agent.icon} size={15} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.name}</div>
        </div>
        <StatusPill status={status} size="sm" />
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", minHeight: 32, lineHeight: 1.4, marginBottom: 9, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{action}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1 }}><Bar value={progress} color={s.color} glow={status === "working"} /></div>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--faint)", width: 30, textAlign: "right" }}>{progress}%</span>
      </div>
    </button>
  );
}

/* ---- slide-over ---- */
function SlideOver({ open, onClose, title, icon, children, width = 460 }: {
  open: boolean; onClose: () => void; title: string; icon?: string; children?: ReactNode; width?: number;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--scrim)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 200ms", zIndex: 80 }} />
      <div className="glass-strong" style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width, maxWidth: "92vw", zIndex: 81,
        transform: open ? "translateX(0)" : "translateX(102%)", transition: "transform 260ms cubic-bezier(0.22,1,0.36,1)",
        borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          {icon && <span style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent)" }}><Icon name={icon} size={15} /></span>}
          <h3 className="h3" style={{ flex: 1 }}>{title}</h3>
          <IconBtn name="x" title="Close" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      </div>
    </>
  );
}

/* ---- main ---- */
export function Run({ onComplete, runLayout, setRunLayout, graphLayout, setGraphLayout }: {
  onComplete: () => void; runLayout: RunLayout; setRunLayout: (v: RunLayout) => void;
  graphLayout: GraphLayout; setGraphLayout: (v: GraphLayout) => void; motion?: number;
}) {
  const [clock, setClock] = useState(2);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [selected, setSelected] = useState<string | null>(null);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setClock((c) => {
        if (c >= 100) { clearInterval(id); return 100; }
        return Math.min(100, c + 0.35 * speed);
      });
    }, 60);
    return () => clearInterval(id);
  }, [playing, speed]);

  const done = clock >= 100;

  const statuses: Record<string, AgentStatus> = {}; const progress: Record<string, number> = {}; const actions: Record<string, string> = {};
  AGENTS.forEach((a) => { statuses[a.id] = statusFor(a, clock); progress[a.id] = progressFor(a, clock); actions[a.id] = actionFor(a, clock); });

  const flows: { from: string; to: string }[] = [];
  AGENTS.forEach((a) => a.deps.forEach((d) => {
    if (statuses[a.id] === "working" && (statuses[d] === "done" || statuses[d] === "working")) flows.push({ from: d, to: a.id });
  }));

  const visible = TIMELINE.filter((e) => e.t <= clock);
  const overall = Math.round(AGENTS.reduce((s, a) => s + progressFor(a, clock), 0) / AGENTS.length);
  const reconnecting = clock >= 44 && clock < 47.5;
  const escalating = clock >= 65 && clock < 72;

  useEffect(() => {
    const el = logRef.current; if (!el || !atBottom) return;
    el.scrollTop = el.scrollHeight;
  }, [visible.length, atBottom]);
  function onLogScroll() {
    const el = logRef.current; if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }

  const graphFlex = runLayout === "graph" ? 1 : runLayout === "logs" ? 0 : 1.45;
  const showGraph = runLayout !== "logs";
  const showLogCol = runLayout !== "graph";
  const selAgent = AGENTS.find((a) => a.id === selected);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!done ? (
            <Btn kind={playing ? "secondary" : "primary"} icon={playing ? "pause" : "play"} onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Resume"}</Btn>
          ) : (
            <Btn kind="primary" icon="arrow-right" iconRight="arrow-right" onClick={onComplete}>View output</Btn>
          )}
          {!done && <Btn kind="danger" icon="x">Cancel</Btn>}
          {!done && <Segmented<number> size="sm" options={[{ value: 1, label: "1×" }, { value: 2, label: "2×" }, { value: 4, label: "4×" }]} value={speed} onChange={setSpeed} />}
        </div>

        <div style={{ flex: 1 }} />

        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 28, padding: "0 11px", borderRadius: "var(--r-pill)", fontSize: 12, fontWeight: 600, background: reconnecting ? "var(--st-blocked-soft)" : "var(--st-done-soft)", color: reconnecting ? "var(--st-blocked)" : "var(--st-done)", border: `1px solid color-mix(in oklab, ${reconnecting ? "var(--st-blocked)" : "var(--st-done)"} 30%, transparent)` }}>
          {reconnecting ? <><span style={{ width: 12, height: 12, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: 999, animation: "swarm-spin 0.7s linear infinite" }} /> Reconnecting…</> : <><StatusDot status="done" size={7} /> Live</>}
        </span>
        <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={13} color="var(--faint)" />{fmtElapsed(clock)}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ring value={overall} size={34} stroke={3.5}><span style={{ fontSize: 9.5 }}>{overall}%</span></Ring>
        </div>
        <Btn kind="secondary" icon="folder" onClick={() => setShowWorkspace(true)}>Workspace</Btn>
        <Segmented<RunLayout> size="sm" options={[{ value: "split", label: "Split" }, { value: "graph", label: "Graph" }, { value: "logs", label: "Logs" }]} value={runLayout} onChange={setRunLayout} />
      </div>

      {escalating && (
        <div className="rise" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", background: "var(--st-blocked-soft)", borderBottom: "1px solid color-mix(in oklab, var(--st-blocked) 30%, transparent)", color: "var(--st-blocked)", fontSize: 12.5, fontWeight: 500 }}>
          <Icon name="alert-triangle-fill" size={15} color="var(--st-blocked)" />
          <span style={{ color: "var(--text-2)" }}><b style={{ color: "var(--st-blocked)" }}>Supervisor re-planning.</b> Fact-Checker flagged an unsupported claim — Lead Researcher is arbitrating and adjusting slide 4.</span>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0, gap: 0 }}>
        {showGraph && (
          <div style={{ flex: graphFlex, minWidth: 0, display: "flex", flexDirection: "column", borderRight: showLogCol ? "1px solid var(--border)" : "none" }}>
            <div style={{ flex: 1, position: "relative", minHeight: 0, background: "var(--bg-2)" }}>
              <div style={{ position: "absolute", top: 12, left: 14, zIndex: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone="cyan" icon="activity">{AGENTS.filter((a) => statuses[a.id] === "working").length} active</Badge>
                <Segmented<GraphLayout> size="sm" options={[{ value: "layered", label: "Layered" }, { value: "vertical", label: "Vertical" }, { value: "radial", label: "Radial" }]} value={graphLayout} onChange={setGraphLayout} />
              </div>
              <AgentGraph agents={AGENTS} statuses={statuses} progress={progress} layout={graphLayout} flows={flows} selected={selected} onSelect={(a) => setSelected(a.id)} />
            </div>
            <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", padding: "12px 14px", background: "var(--surface)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span className="eyebrow">Agents · {AGENTS.length}</span>
                <span className="faint" style={{ fontSize: 11 }}>{AGENTS.filter((a) => statuses[a.id] === "done").length} done · {AGENTS.filter((a) => statuses[a.id] === "working").length} working</span>
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {AGENTS.map((a) => <AgentProgressCard key={a.id} agent={a} status={statuses[a.id]} progress={progress[a.id]} action={actions[a.id]} selected={selected === a.id} onClick={() => setSelected(a.id)} />)}
              </div>
            </div>
          </div>
        )}

        {showLogCol && (
          <div style={{ width: runLayout === "logs" ? "100%" : 392, flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0, background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <Icon name="activity" size={15} color="var(--accent)" />
              <span className="h4">Activity</span>
              <Badge tone="neutral">{visible.length}</Badge>
              <div style={{ flex: 1 }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--st-working)" }}><StatusDot status="working" size={6} /> streaming</span>
            </div>
            <div ref={logRef} onScroll={onLogScroll} role="log" aria-live="polite" style={{ flex: 1, overflow: "auto", position: "relative", minHeight: 0 }}>
              {visible.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>Awaiting first signal…</div>
              ) : visible.map((ev, i) => <LogLine key={i} ev={ev} />)}
            </div>
            {!atBottom && (
              <button onClick={() => { setAtBottom(true); const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }}
                style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: "var(--r-pill)", background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, boxShadow: "var(--shadow-md)", zIndex: 10 }}>
                <Icon name="arrow-down" size={13} color="#fff" /> Jump to latest
              </button>
            )}
          </div>
        )}
      </div>

      <SlideOver open={!!selAgent} onClose={() => setSelected(null)} title={selAgent ? selAgent.name : ""} icon={selAgent ? selAgent.icon : "user"}>
        {selAgent && (
          <div style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <StatusPill status={statuses[selAgent.id]} />
              <span className="faint" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{selAgent.role}</span>
              <span style={{ flex: 1 }} />
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{progress[selAgent.id]}%</span>
            </div>
            <Bar value={progress[selAgent.id]} color={(STATUS[statuses[selAgent.id]] || STATUS.idle).color} glow />
            <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, margin: "16px 0" }}>{selAgent.why}</p>
            <div style={{ padding: 12, borderRadius: "var(--r-md)", background: "var(--elevated)", border: "1px solid var(--border)", marginBottom: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Current action</div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>{actions[selAgent.id]}</div>
            </div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Activity from this agent</div>
            <div style={{ borderRadius: "var(--r-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
              {visible.filter((e) => e.agent === selAgent.id).slice(-8).reverse().map((ev, i) => <LogLine key={i} ev={ev} />)}
              {visible.filter((e) => e.agent === selAgent.id).length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--faint)", fontSize: 12.5 }}>No activity yet.</div>}
            </div>
          </div>
        )}
      </SlideOver>

      <SlideOver open={showWorkspace} onClose={() => setShowWorkspace(false)} title="Shared workspace" icon="folder" width={520}>
        <div style={{ padding: 18 }}>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Notes written by agents during the run, grouped by topic. {visible.filter((e) => e.type === "note").length} notes so far.</p>
          {WORKSPACE.map((group) => {
            const agent = AGENTS.find((a) => a.id === group.agent);
            return (
              <div key={group.topic} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: agent ? agent.accent : "var(--accent)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{group.topic}</span>
                  <span className="faint" style={{ fontSize: 11 }}>{group.notes.length} notes · {agent ? agent.name : ""}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.notes.map((n, i) => (
                    <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{n}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SlideOver>
    </div>
  );
}
