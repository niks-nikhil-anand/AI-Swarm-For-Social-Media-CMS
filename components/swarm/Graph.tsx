"use client";
/* ============================================================
   SWARM — Agent graph (signature live visualization)
   layout: "layered" | "radial" | "vertical"
   ============================================================ */
import { useState, useEffect, useRef, useMemo, type RefObject, type CSSProperties } from "react";
import { Icon, StatusDot, STATUS } from "./ui";
import type { Agent, AgentStatus } from "./data";

type GraphLayout = "layered" | "radial" | "vertical";
interface Pt { x: number; y: number }
interface Edge { from: string; to: string }

function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function maxLayer(agents: Agent[]) { return agents.reduce((m, a) => Math.max(m, a.layer), 0); }

function computeLayout(agents: Agent[], layout: GraphLayout, W: number, H: number): Record<string, Pt> {
  const pad = { x: 70, y: 56 };
  const iw = Math.max(W - pad.x * 2, 10), ih = Math.max(H - pad.y * 2, 10);
  const pos: Record<string, Pt> = {};
  if (layout === "radial") {
    const lead = agents.find((a) => a.deps.length === 0) || agents[0];
    const cx = W / 2, cy = H / 2;
    pos[lead.id] = { x: cx, y: cy };
    const rest = agents.filter((a) => a.id !== lead.id);
    const R = Math.min(iw, ih) / 2;
    rest.forEach((a, i) => {
      const ang = (-Math.PI / 2) + (i / rest.length) * Math.PI * 2;
      const ring = 0.55 + (a.layer / (maxLayer(agents) + 1)) * 0.45;
      pos[a.id] = { x: cx + Math.cos(ang) * R * ring, y: cy + Math.sin(ang) * R * ring };
    });
    return pos;
  }
  const vertical = layout === "vertical";
  const byLayer: Record<number, Agent[]> = {};
  agents.forEach((a) => { (byLayer[a.layer] = byLayer[a.layer] || []).push(a); });
  const layers = Object.keys(byLayer).map(Number).sort((a, b) => a - b);
  const n = layers.length;
  layers.forEach((L, li) => {
    const group = byLayer[L];
    group.forEach((a, gi) => {
      const along = n === 1 ? 0.5 : li / (n - 1);
      const across = group.length === 1 ? 0.5 : gi / (group.length - 1);
      if (vertical) {
        pos[a.id] = { x: pad.x + across * iw, y: pad.y + along * ih };
      } else {
        pos[a.id] = { x: pad.x + along * iw, y: pad.y + across * ih };
      }
    });
  });
  return pos;
}

function edgePath(s: Pt | undefined, t: Pt | undefined, layout: GraphLayout) {
  if (!s || !t) return "";
  if (layout === "radial") {
    const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
    const dx = t.x - s.x, dy = t.y - s.y;
    const cx = mx - dy * 0.12, cy = my + dx * 0.12;
    return `M ${s.x} ${s.y} Q ${cx} ${cy} ${t.x} ${t.y}`;
  }
  if (layout === "vertical") {
    const my = (s.y + t.y) / 2;
    return `M ${s.x} ${s.y} C ${s.x} ${my}, ${t.x} ${my}, ${t.x} ${t.y}`;
  }
  const mx = (s.x + t.x) / 2;
  return `M ${s.x} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${t.x} ${t.y}`;
}

function GraphNode({ agent, pos, status, progress, selected, onSelect, compact }: {
  agent: Agent; pos: Pt; status: AgentStatus; progress: number; selected: boolean; onSelect: (a: Agent) => void; compact: boolean;
}) {
  const s = STATUS[status] || STATUS.idle;
  const working = status === "working";
  const w = compact ? 92 : 116, h = compact ? 54 : 62;
  return (
    <button onClick={() => onSelect(agent)} title={agent.name}
      style={{
        position: "absolute", left: pos.x - w / 2, top: pos.y - h / 2, width: w, height: h,
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 5, padding: "8px 10px",
        borderRadius: "var(--r-md)", cursor: "pointer", fontFamily: "var(--font)", textAlign: "left",
        background: selected ? "var(--elevated-2)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--accent-line)" : working ? "color-mix(in oklab, " + s.color + " 50%, transparent)" : "var(--border)"}`,
        boxShadow: working
          ? `0 0 0 1px color-mix(in oklab, ${s.color} 30%, transparent), 0 0 18px -2px color-mix(in oklab, ${s.color} 55%, transparent)`
          : selected ? "0 0 0 1px var(--accent-line)" : "var(--shadow-sm)",
        transition: "box-shadow 240ms, border-color 240ms, background 160ms, transform 200ms",
        transform: working ? "translateZ(0)" : "none",
        animation: working ? "swarm-breathe 2.4s ease-in-out infinite" : "none",
        zIndex: selected ? 6 : 4,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", color: agent.accent }}>
          <Icon name={agent.icon} size={13} />
        </span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.short}</span>
        {status === "done" ? <Icon name="check-circle-fill" size={14} color="var(--st-done)" />
          : status === "blocked" ? <Icon name="alert-triangle-fill" size={13} color="var(--st-blocked)" />
          : status === "error" ? <Icon name="alert-circle-fill" size={13} color="var(--st-error)" />
          : <StatusDot status={status} size={7} />}
      </div>
      {!compact && (
        <div style={{ height: 3, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: s.color, borderRadius: 999, transition: "width 0.5s ease", boxShadow: working ? `0 0 6px ${s.color}` : "none" }} />
        </div>
      )}
    </button>
  );
}

export function AgentGraph({ agents, statuses, progress, layout = "layered", flows = [], selected, onSelect }: {
  agents: Agent[]; statuses: Record<string, AgentStatus>; progress: Record<string, number>;
  layout?: GraphLayout; flows?: Edge[]; selected: string | null; onSelect: (a: Agent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { w: W, h: H } = useSize(ref);
  const pos = useMemo(() => (W && H ? computeLayout(agents, layout, W, H) : {}), [agents, layout, W, H]);
  const compact = W < 560;

  const edges: Edge[] = [];
  agents.forEach((a) => a.deps.forEach((d) => { if (pos[d] && pos[a.id]) edges.push({ from: d, to: a.id }); }));

  const isFlow = (e: Edge) => flows.some((f) => f.from === e.from && f.to === e.to);

  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(var(--border-soft) 1px, transparent 1px)", backgroundSize: "26px 26px", opacity: 0.5, pointerEvents: "none" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M1 1 L6 4 L1 7" fill="none" stroke="var(--border-strong)" strokeWidth="1.2" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const active = isFlow(e);
          const srcDone = statuses[e.from] === "done";
          const d = edgePath(pos[e.from], pos[e.to], layout);
          return (
            <path key={i} d={d} fill="none"
              stroke={active ? "var(--accent)" : srcDone ? "color-mix(in oklab, var(--accent) 32%, var(--border))" : "var(--border)"}
              strokeWidth={active ? 1.8 : 1.2}
              strokeDasharray={active ? "5 5" : "none"}
              markerEnd="url(#arrow)"
              style={{ animation: active ? "swarm-dash 0.8s linear infinite" : "none", transition: "stroke 300ms", opacity: active ? 1 : srcDone ? 0.8 : 0.5 }} />
          );
        })}
      </svg>
      {edges.map((e, i) => isFlow(e) && (
        <span key={"f" + i} style={{
          position: "absolute", left: 0, top: 0, width: 7, height: 7, borderRadius: 999,
          background: "var(--accent)", boxShadow: "0 0 8px 2px var(--accent-glow)", pointerEvents: "none",
          offsetPath: `path('${edgePath(pos[e.from], pos[e.to], layout)}')`,
          WebkitOffsetPath: `path('${edgePath(pos[e.from], pos[e.to], layout)}')`,
          animation: "swarm-flow 1.5s linear infinite", marginLeft: -3.5, marginTop: -3.5,
        } as CSSProperties} />
      ))}
      {agents.map((a) => pos[a.id] && (
        <GraphNode key={a.id} agent={a} pos={pos[a.id]} status={statuses[a.id] || "idle"} progress={progress[a.id] || 0} selected={selected === a.id} onSelect={onSelect} compact={compact} />
      ))}
    </div>
  );
}
