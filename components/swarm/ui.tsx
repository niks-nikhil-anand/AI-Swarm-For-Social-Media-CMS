"use client";
/* ============================================================
   SWARM — shared UI primitives
   ============================================================ */
import React, { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";

/* ---------- Icon ----------
   Flight Icons are monochrome `currentColor` SVGs. We fetch the markup once
   (cached) and inline it, so the glyph inherits the surrounding text color in
   every context. */
const __iconCache: Record<string, string | null | undefined> = {};
const __iconListeners = new Set<() => void>();
function loadIcon(name: string) {
  if (__iconCache[name] !== undefined) return;
  __iconCache[name] = null;
  fetch(`/icons/${name}-16.svg`)
    .then((r) => (r.ok ? r.text() : ""))
    .then((txt) => { __iconCache[name] = txt || ""; __iconListeners.forEach((fn) => fn()); })
    .catch(() => { __iconCache[name] = ""; __iconListeners.forEach((fn) => fn()); });
}

export function Icon({ name, size = 16, color, style, className }: {
  name: string; size?: number; color?: string; style?: CSSProperties; className?: string;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    if (__iconCache[name]) return;
    const fn = () => force((n) => n + 1);
    __iconListeners.add(fn);
    loadIcon(name);
    return () => { __iconListeners.delete(fn); };
  }, [name]);
  const svg = __iconCache[name];
  return (
    <span
      aria-hidden="true"
      className={`swarm-ico ${className || ""}`}
      style={{ display: "inline-flex", width: size, height: size, flexShrink: 0, color: color || "currentColor", verticalAlign: "middle", ...style }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

/* ---------- Swarm logo ---------- */
export function SwarmMark({ size = 26, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <Image
      src="/logo/logo.png"
      alt="Swarm"
      width={size}
      height={size}
      style={{
        display: "block", width: size, height: size, borderRadius: "22%", objectFit: "cover",
        filter: glow ? "drop-shadow(0 0 6px var(--accent-glow))" : "none",
      }}
    />
  );
}

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <SwarmMark size={26} />
      {!collapsed && (
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)" }}>Swarm</span>
      )}
    </div>
  );
}

/* ---------- Button ---------- */
type BtnKind = "primary" | "secondary" | "ghost" | "glass" | "danger" | "dangerSolid";
export function Btn({ children, kind = "secondary", size = "md", icon, iconRight, onClick, disabled, full, style, title, type = "button" }: {
  children?: ReactNode; kind?: BtnKind; size?: "sm" | "md" | "lg"; icon?: string; iconRight?: string;
  onClick?: () => void; disabled?: boolean; full?: boolean; style?: CSSProperties; title?: string;
  type?: "button" | "submit" | "reset";
}) {
  const dims = size === "sm" ? { h: 30, pad: "0 12px", fs: 13 }
            : size === "lg" ? { h: 44, pad: "0 22px", fs: 15 }
            : { h: 36, pad: "0 16px", fs: 14 };
  const base: CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    height: dims.h, padding: dims.pad, fontSize: dims.fs, fontWeight: 600, fontFamily: "var(--font)",
    borderRadius: "var(--r-sm)", borderWidth: 1, borderStyle: "solid", borderColor: "transparent", whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
    width: full ? "100%" : undefined, letterSpacing: "-0.1px",
    transition: "background 140ms, border-color 140ms, color 140ms, box-shadow 140ms, transform 120ms",
  };
  const kinds: Record<BtnKind, CSSProperties> = {
    primary:  { background: "var(--accent)", color: "var(--on-accent)", boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 18px -8px var(--accent-glow)" },
    secondary:{ background: "var(--elevated)", color: "var(--text)", borderColor: "var(--border)" },
    ghost:    { background: "transparent", color: "var(--muted)" },
    glass:    { background: "var(--glass)", color: "var(--text)", borderColor: "var(--glass-border)", backdropFilter: "blur(14px)" },
    danger:   { background: "transparent", color: "var(--st-error)", borderColor: "color-mix(in oklab, var(--st-error) 40%, transparent)" },
    dangerSolid:{ background: "var(--st-error)", color: "#fff" },
  };
  const hk: Record<BtnKind, CSSProperties> = {
    primary:  { filter: "brightness(1.08)", transform: "translateY(-1px)" },
    secondary:{ background: "var(--elevated-2)", borderColor: "var(--border-strong)" },
    ghost:    { background: "var(--elevated)", color: "var(--text)" },
    glass:    { background: "var(--glass-strong)" },
    danger:   { background: "var(--st-error-soft)" },
    dangerSolid:{ filter: "brightness(1.08)" },
  };
  const [hover, setHover] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...base, ...kinds[kind], ...(hover && !disabled ? hk[kind] : {}), ...style }}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 15} style={{ filter: "none", opacity: 0.95 }} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 14 : 15} style={{ filter: "none", opacity: 0.95 }} />}
    </button>
  );
}

/* ---------- Icon-only button ---------- */
export function IconBtn({ name, onClick, title, active, size = 36, badge, style }: {
  name: string; onClick?: () => void; title?: string; active?: boolean; size?: number; badge?: boolean; style?: CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={title} aria-label={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--r-sm)", borderWidth: 1, borderStyle: "solid", cursor: "pointer", position: "relative",
        background: active ? "var(--accent-soft)" : hover ? "var(--elevated-2)" : "var(--elevated)",
        color: active ? "var(--accent)" : "var(--muted)", transition: "background 140ms, border-color 140ms",
        borderColor: active ? "var(--accent-line)" : "var(--border)", ...style,
      }}>
      <Icon name={name} size={16} style={{ filter: active ? "none" : "var(--icon-filter)" }} />
      {badge && <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: 999, background: "var(--st-blocked)", boxShadow: "0 0 0 2px var(--surface)" }} />}
    </button>
  );
}

/* ---------- Badge ---------- */
type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "cyan";
export function Badge({ children, tone = "neutral", icon, style }: {
  children?: ReactNode; tone?: Tone; icon?: string; style?: CSSProperties;
}) {
  const tones: Record<Tone, { background: string; color: string; border: string }> = {
    neutral:  { background: "var(--elevated-2)", color: "var(--muted)", border: "var(--border)" },
    accent:   { background: "var(--accent-soft)", color: "var(--accent-2)", border: "var(--accent-line)" },
    success:  { background: "var(--st-done-soft)", color: "var(--st-done)", border: "color-mix(in oklab, var(--st-done) 36%, transparent)" },
    warning:  { background: "var(--st-blocked-soft)", color: "var(--st-blocked)", border: "color-mix(in oklab, var(--st-blocked) 36%, transparent)" },
    danger:   { background: "var(--st-error-soft)", color: "var(--st-error)", border: "color-mix(in oklab, var(--st-error) 36%, transparent)" },
    cyan:     { background: "var(--st-working-soft)", color: "var(--st-working)", border: "color-mix(in oklab, var(--st-working) 36%, transparent)" },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 9px",
      borderRadius: "var(--r-pill)", fontSize: 11.5, fontWeight: 600, lineHeight: 1,
      background: t.background, color: t.color, border: `1px solid ${t.border}`, ...style,
    }}>
      {icon && <Icon name={icon} size={12} style={{ filter: "none" }} />}
      {children}
    </span>
  );
}

/* ---------- Status pill (agent states) ---------- */
export const STATUS: Record<string, { label: string; color: string; soft: string; pulse?: boolean }> = {
  idle:    { label: "Idle",    color: "var(--st-idle)",    soft: "var(--st-idle-soft)" },
  working: { label: "Working", color: "var(--st-working)", soft: "var(--st-working-soft)", pulse: true },
  blocked: { label: "Blocked", color: "var(--st-blocked)", soft: "var(--st-blocked-soft)" },
  waiting: { label: "Waiting", color: "var(--st-blocked)", soft: "var(--st-blocked-soft)" },
  done:    { label: "Done",    color: "var(--st-done)",    soft: "var(--st-done-soft)" },
  error:   { label: "Error",   color: "var(--st-error)",   soft: "var(--st-error-soft)" },
};
export function StatusDot({ status, size = 8 }: { status: string; size?: number }) {
  const s = STATUS[status] || STATUS.idle;
  return (
    <span style={{
      width: size, height: size, borderRadius: 999, background: s.color, flexShrink: 0,
      ["--pulse-color" as string]: s.color,
      animation: s.pulse ? "swarm-pulse 1.6s ease-out infinite" : "none",
    } as CSSProperties} />
  );
}
export function StatusPill({ status, label, size = "md" }: { status: string; label?: string; size?: "sm" | "md" }) {
  const s = STATUS[status] || STATUS.idle;
  const sm = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: sm ? 20 : 24,
      padding: sm ? "0 8px" : "0 10px", borderRadius: "var(--r-pill)", fontSize: sm ? 11 : 12,
      fontWeight: 600, background: s.soft, color: s.color, border: `1px solid color-mix(in oklab, ${s.color} 30%, transparent)`,
    }}>
      <StatusDot status={status} size={sm ? 6 : 7} />
      {label || s.label}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({ children, style, glass, hover, onClick, pad, className, onMouseEnter, onMouseLeave }: {
  children?: ReactNode; style?: CSSProperties; glass?: boolean; hover?: boolean; onClick?: () => void;
  pad?: number | string; className?: string; onMouseEnter?: () => void; onMouseLeave?: () => void;
}) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} className={className}
      onMouseEnter={() => { if (hover) setH(true); onMouseEnter?.(); }}
      onMouseLeave={() => { if (hover) setH(false); onMouseLeave?.(); }}
      style={{
        background: glass ? "var(--glass)" : "var(--surface)",
        backdropFilter: glass ? "blur(18px) saturate(140%)" : undefined,
        WebkitBackdropFilter: glass ? "blur(18px) saturate(140%)" : undefined,
        borderWidth: 1, borderStyle: "solid",
        borderRadius: "var(--r-lg)", padding: pad != null ? pad : "var(--card-pad)",
        boxShadow: h ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: h ? "translateY(-2px)" : "none", cursor: onClick ? "pointer" : undefined,
        transition: "transform 160ms cubic-bezier(0.22,1,0.36,1), box-shadow 160ms, border-color 140ms",
        borderColor: h ? "var(--border-strong)" : (glass ? "var(--glass-border)" : "var(--border)"),
        ...style,
      }}>
      {children}
    </div>
  );
}

/* ---------- Progress ring ---------- */
export function Ring({ value = 0, size = 44, stroke = 4, color = "var(--accent)", track = "var(--border)", children }: {
  value?: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode; label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value / 100)));
  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)", filter: "drop-shadow(0 0 4px var(--accent-glow))" }} />
      </svg>
      <div className="tabular" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: size > 70 ? 18 : 11, fontWeight: 700 }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Linear progress ---------- */
export function Bar({ value = 0, color = "var(--accent)", height = 4, glow }: {
  value?: number; color?: string; height?: number; glow?: boolean;
}) {
  return (
    <div style={{ height, background: "var(--border)", borderRadius: 999, overflow: "hidden", width: "100%" }}>
      <div style={{
        width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: color,
        borderRadius: 999, transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: glow ? `0 0 8px ${color}` : "none",
      }} />
    </div>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ on, onChange, size = "md" }: { on: boolean; onChange: (v: boolean) => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? 32 : 40, h = size === "sm" ? 18 : 22, k = h - 4;
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      style={{
        width: w, height: h, borderRadius: 999, border: "none", cursor: "pointer", padding: 0, position: "relative",
        background: on ? "var(--accent)" : "var(--border-strong)", transition: "background 180ms",
        boxShadow: on ? "0 0 12px -2px var(--accent-glow)" : "none",
      }}>
      <span style={{
        position: "absolute", top: 2, left: on ? w - k - 2 : 2, width: k, height: k, borderRadius: 999,
        background: "#fff", transition: "left 180ms cubic-bezier(0.22,1,0.36,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }} />
    </button>
  );
}

/* ---------- Segmented control ---------- */
export type SegOption = string | { value: string | number; label: string; icon?: string };
export function Segmented<T extends string | number>({ options, value, onChange, size = "md" }: {
  options: (string | { value: T; label: string; icon?: string })[]; value: T; onChange: (v: T) => void; size?: "sm" | "md";
}) {
  return (
    <div style={{ display: "inline-flex", padding: 3, gap: 2, background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}>
      {options.map((o) => {
        const v = (typeof o === "string" ? o : o.value) as T;
        const lab = typeof o === "string" ? o : o.label;
        const ic = typeof o === "object" ? o.icon : undefined;
        const active = v === value;
        return (
          <button key={String(v)} onClick={() => onChange(v)} style={{
            height: size === "sm" ? 26 : 30, padding: "0 12px", border: "none", cursor: "pointer", borderRadius: "var(--r-xs)",
            fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font)",
            background: active ? "var(--accent-soft)" : "transparent",
            color: active ? "var(--accent-2)" : "var(--muted)",
            display: "inline-flex", alignItems: "center", gap: 6, transition: "background 140ms, color 140ms",
          }}>
            {ic && <Icon name={ic} size={14} style={{ filter: active ? "none" : "var(--icon-filter)" }} />}
            {lab}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Stepper (5-stage) ---------- */
export interface Stage { key: string; label: string }
export function Stepper({ stages, current, reached, onJump }: {
  stages: Stage[]; current: string; reached: string[]; onJump: (key: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {stages.map((s, i) => {
        const isCur = s.key === current;
        const idx = stages.findIndex((x) => x.key === current);
        const done = i < idx && reached.includes(s.key);
        const ok = reached.includes(s.key);
        return (
          <React.Fragment key={s.key}>
            {i > 0 && (
              <div style={{ width: 22, height: 1.5, background: i <= idx ? "var(--accent-line)" : "var(--border)", margin: "0 2px" }} />
            )}
            <button onClick={() => ok && onJump(s.key)} disabled={!ok} style={{
              display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 11px 0 8px",
              borderRadius: "var(--r-pill)", cursor: ok ? "pointer" : "default", fontFamily: "var(--font)",
              border: `1px solid ${isCur ? "var(--accent-line)" : "transparent"}`,
              background: isCur ? "var(--accent-soft)" : "transparent",
              transition: "background 140ms, border-color 140ms",
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 10.5, fontWeight: 700,
                background: isCur ? "var(--accent)" : done ? "var(--st-done)" : ok ? "var(--elevated-2)" : "transparent",
                color: (isCur || done) ? "#fff" : "var(--faint)",
                border: ok || isCur ? "none" : "1px solid var(--border)",
              }}>
                {done ? <Icon name="check" size={11} style={{ filter: "brightness(0) invert(1)" }} /> : i + 1}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: isCur ? "var(--accent-2)" : ok ? "var(--text-2)" : "var(--faint)" }}>{s.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function Empty({ icon, title, body, action }: { icon: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 24px", gap: 4 }}>
      <div style={{ width: 56, height: 56, borderRadius: "var(--r-lg)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", border: "1px solid var(--border)", marginBottom: 8 }}>
        <Icon name={icon} size={24} />
      </div>
      <div className="h3">{title}</div>
      <p className="muted" style={{ maxWidth: 360, fontSize: 13.5 }}>{body}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

/* ---------- kbd ---------- */
export function Kbd({ children }: { children?: ReactNode }) {
  return <kbd style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)", padding: "2px 6px", border: "1px solid var(--border)", borderRadius: 5, background: "var(--elevated)" }}>{children}</kbd>;
}
