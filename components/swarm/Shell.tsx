"use client";
/* ============================================================
   SWARM — App shell (Sidebar + TopBar)
   ============================================================ */
import { useState, type ReactNode } from "react";
import { Logo, Icon, IconBtn, Btn, StatusDot, Stepper, type Stage } from "./ui";
import { HISTORY } from "./data";

function NavItem({ icon, label, active, onClick, count, badge }: {
  icon: string; label: string; active?: boolean; onClick?: () => void; count?: number; badge?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", height: 36, padding: "0 10px",
        border: "none", cursor: "pointer", borderRadius: "var(--r-sm)", textAlign: "left",
        fontFamily: "var(--font)", fontSize: 13.5, fontWeight: 500,
        background: active ? "var(--accent-soft)" : h ? "var(--elevated)" : "transparent",
        color: active ? "var(--accent-2)" : h ? "var(--text)" : "var(--muted)",
        transition: "background 130ms, color 130ms",
      }}>
      <Icon name={icon} size={16} />
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span className="mono" style={{ fontSize: 11, color: "var(--faint)" }}>{count}</span>}
      {badge && <StatusDot status="working" size={7} />}
    </button>
  );
}

export function Sidebar({ view, activeSession, onNew, onGo, onOpenSession }: {
  view: string; activeSession: string | null; onNew: () => void;
  onGo: (a: { view: string }) => void; onOpenSession: (id: string) => void;
}) {
  return (
    <aside style={{
      width: "var(--nav-w)", flexShrink: 0, height: "100%", boxSizing: "border-box",
      background: "var(--bg-2)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", padding: "14px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px 14px" }}>
        <Logo />
        <IconBtn name="layers" size={30} title="Collapse" />
      </div>

      <Btn kind="primary" icon="plus" full onClick={onNew} style={{ marginBottom: 14 }}>New project</Btn>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 }}>
        <NavItem icon="dashboard" label="Dashboard" active={view === "dashboard"} onClick={() => onGo({ view: "dashboard" })} />
        <NavItem icon="history" label="All projects" active={view === "history"} onClick={() => onGo({ view: "history" })} count={HISTORY.length} />
        <NavItem icon="tools" label="Skills" active={view === "skills"} onClick={() => onGo({ view: "skills" })} />
      </div>

      <div className="eyebrow" style={{ padding: "0 8px 8px" }}>Recent sessions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "auto", flex: 1, margin: "0 -4px", padding: "0 4px" }}>
        {HISTORY.slice(0, 6).map((p) => {
          const active = (view === "flow" && p.id === "p1") || (view === "session" && activeSession === p.id);
          return (
            <button key={p.id} onClick={() => onOpenSession(p.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px",
                border: "none", cursor: "pointer", borderRadius: "var(--r-sm)", textAlign: "left",
                background: active ? "var(--elevated)" : "transparent", transition: "background 130ms",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--elevated)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: p.accent, flexShrink: 0, boxShadow: active ? `0 0 8px ${p.accent}` : "none" }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, color: active ? "var(--text)" : "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</span>
              {p.status === "running" && <StatusDot status="working" size={6} />}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem icon="settings" label="Settings" active={view === "settings"} onClick={() => onGo({ view: "settings" })} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 4px", marginTop: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: "var(--r-pill)", background: "linear-gradient(135deg, var(--accent-2), var(--accent))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>AC</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>Avery Chen</div>
            <div style={{ fontSize: 11, color: "var(--faint)" }}>Pro · Anthropic</div>
          </div>
          <IconBtn name="more-horizontal" size={28} title="Account" />
        </div>
      </div>
    </aside>
  );
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string }> = {
    drafting:  { label: "Drafting", dot: "idle" },
    awaiting:  { label: "Awaiting approval", dot: "blocked" },
    running:   { label: "Running", dot: "working" },
    complete:  { label: "Complete", dot: "done" },
    failed:    { label: "Failed", dot: "error" },
  };
  const m = map[status] || map.drafting;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7, height: 26, padding: "0 11px",
      borderRadius: "var(--r-pill)", fontSize: 12, fontWeight: 600,
      background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-2)",
    }}>
      <StatusDot status={m.dot} size={7} />
      {m.label}
    </span>
  );
}

export function TopBar({ stages, stage, reached, onJump, status, title, theme, onTheme, actions }: {
  stages: Stage[] | null; stage: string; reached: string[]; onJump: (key: string) => void;
  status: string | null; title: string; theme: string; onTheme: () => void; actions?: ReactNode;
}) {
  return (
    <header style={{
      height: 60, flexShrink: 0, display: "flex", alignItems: "center", gap: 16, padding: "0 20px",
      background: "var(--glass-strong)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)", position: "relative", zIndex: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>
              {title}
            </h1>
            {status && <StatusChip status={status} />}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {stages && <Stepper stages={stages} current={stage} reached={reached} onJump={onJump} />}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {actions}
        <IconBtn name="search" title="Search ⌘K" />
        <IconBtn name="bell" title="Notifications" badge />
        <ThemeToggle theme={theme} onClick={onTheme} />
      </div>
    </header>
  );
}

export function ThemeToggle({ theme, onClick }: { theme: string; onClick: () => void }) {
  const dark = theme === "dark";
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title="Toggle theme" aria-label="Toggle theme"
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--r-sm)", border: "1px solid var(--border)", cursor: "pointer",
        background: h ? "var(--elevated-2)" : "var(--elevated)", color: "var(--muted)", transition: "background 140ms",
      }}>
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" fill="currentColor" fillOpacity="0.18" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="8" cy="8" r="3.2" fill="currentColor" fillOpacity="0.18" />
          <g><line x1="8" y1="1" x2="8" y2="2.6" /><line x1="8" y1="13.4" x2="8" y2="15" /><line x1="1" y1="8" x2="2.6" y2="8" /><line x1="13.4" y1="8" x2="15" y2="8" /><line x1="3" y1="3" x2="4.1" y2="4.1" /><line x1="11.9" y1="11.9" x2="13" y2="13" /><line x1="13" y1="3" x2="11.9" y2="4.1" /><line x1="4.1" y1="11.9" x2="3" y2="13" /></g>
        </svg>
      )}
    </button>
  );
}
