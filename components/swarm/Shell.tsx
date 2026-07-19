"use client";
/* ============================================================
   SWARM — App shell (Sidebar + TopBar)
   ============================================================ */
import { useState, useEffect, type ReactNode } from "react";
import { StatusDot, type Stage } from "./ui";

export interface CurrentUser { id: string; email: string; name: string | null }
interface RecentProject { id: string; title: string; status: string; accent: string }

const PROJECT_STATUS_MAP: Record<string, string> = { Draft: "running", Running: "running", Complete: "complete", Failed: "failed" };

function useRecentProjects(): RecentProject[] {
  const [projects, setProjects] = useState<RecentProject[]>([]);
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        const rows: { id: string; title: string; status: string }[] = res.ok ? await res.json() : [];
        if (!cancelled) {
          setProjects(rows.map((r) => ({ id: r.id, title: r.title, status: PROJECT_STATUS_MAP[r.status] || "running", accent: "var(--accent)" })));
        }
      } catch {
        if (!cancelled) setProjects([]);
      }
    }
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);
  return projects;
}

export function initialsOf(user: CurrentUser): string {
  if (user.name?.trim()) {
    const parts = user.name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  return user.email[0]?.toUpperCase() || "?";
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);
  return user;
}

function NavItem({ icon, label, active, onClick, count, badge, dot }: {
  icon: string; label: string; active?: boolean; onClick?: () => void; count?: number; badge?: string; dot?: boolean;
}) {
  void count;
  const [h, setH] = useState(false);
  
  // Custom SVG icon rendering matching mockup paths
  const customIcons: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </>
    ),
    layers: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    check: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    chart: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    )
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: "8px 11px",
        borderRadius: "8px",
        cursor: "pointer",
        background: active ? "var(--accbg)" : h ? "var(--card2)" : "transparent",
        color: active ? "var(--acc)" : "var(--mut)",
        fontWeight: active ? 600 : 400,
        fontSize: "12.5px",
        transition: "background 130ms, color 130ms",
        width: "100%"
      }}
    >
      {active && (
        <span style={{ position: "absolute", left: "-10px", top: "50%", transform: "translateY(-50%)", width: "3px", height: "17px", borderRadius: "0 3px 3px 0", background: "var(--acc)" }}></span>
      )}
      <span style={{ width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {customIcons[icon] || customIcons.grid}
        </svg>
      </span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {badge && (
        <span style={{ fontSize: "10px", fontWeight: 600, background: "var(--ambbg)", color: "var(--amb)", borderRadius: "9px", padding: "1px 7px" }}>{badge}</span>
      )}
      {dot && (
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--acc)", animation: "shimmer 1.6s ease-in-out infinite" }}></span>
      )}
    </div>
  );
}

export function Sidebar({ view, activeSession, onNew, onGo, onOpenSession }: {
  view: string; activeSession: string | null; onNew: () => void;
  onGo: (a: { view: string }) => void; onOpenSession: (id: string) => void;
}) {
  void activeSession;
  void onOpenSession;
  const user = useCurrentUser();
  const projects = useRecentProjects();
  void projects;

  const navigation = [
    { label: 'Dashboard', key: 'dashboard', icon: 'grid', section: 'Overview' },
    { label: 'Content Queue', key: 'queue', icon: 'layers', section: 'Content' },
    { label: 'Research', key: 'research', icon: 'search', dot: true },
    { label: 'Approvals', badge: '2', key: 'approvals', icon: 'check' },
    { label: 'Calendar', key: 'calendar', icon: 'calendar' },
    { label: 'Published Posts', key: 'published', icon: 'send' },
    { label: 'Analytics', key: 'analytics', icon: 'chart', section: 'Insights' },
    { label: 'Sources', key: 'sources', icon: 'globe' },
    { label: 'Settings', key: 'settings', icon: 'gear', section: 'System' },
  ];

  return (
    <aside style={{
      width: "228px", flexShrink: 0, height: "100%", boxSizing: "border-box",
      background: "var(--panel)", borderRight: "1px solid var(--line)",
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {/* Workspace Header */}
      <div 
        onClick={onNew}
        style={{
          display: "flex", alignItems: "center", gap: "10px", padding: "15px 14px",
          borderBottom: "1px solid var(--line)", cursor: "pointer", transition: "background 150ms"
        }}
      >
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: "linear-gradient(135deg, var(--acc), #7a5cff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "15px", color: "#fff",
          boxShadow: "0 2px 8px rgba(87,182,255,.35)", flexShrink: 0
        }}>S</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "13.5px", lineHeight: 1.15, color: "var(--text)" }}>Social Swarm</div>
          <div style={{ fontSize: "10.5px", color: "var(--faint)" }}>rubenius workspace</div>
        </div>
        <span style={{ color: "var(--faint)", fontSize: "12px" }}>⌄</span>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {navigation.map((n, idx) => {
          const isViewActive = view === n.key;
          return (
            <div key={idx}>
              {n.section && (
                <div style={{ fontSize: "9.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--faint)", padding: "14px 10px 5px" }}>
                  {n.section}
                </div>
              )}
              <NavItem
                icon={n.icon}
                label={n.label}
                active={isViewActive}
                onClick={() => onGo({ view: n.key })}
                badge={n.badge}
                dot={n.dot}
              />
            </div>
          );
        })}
      </nav>

      {/* Today's plan widget */}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "11px", padding: "13px 14px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text)" }}>Today&apos;s plan</span>
            <div style={{ flex: 1 }}></div>
            <span style={{ fontSize: "10.5px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--mut)" }}>1/3 ready</span>
          </div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "11px" }}>
            <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--grn)" }}></div>
            <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--amb)" }}></div>
            <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--acc)" }}></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--mut)" }}>
              <span>Worker queue</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--amb)" }}>8</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--mut)" }}>
              <span>Signals today</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>27</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--mut)" }}>
              <span>Active runs</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--acc)" }}>4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Footer */}
      <div style={{ borderTop: "1px solid var(--line)", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "50%",
          background: "linear-gradient(135deg, var(--acc), #7a5cff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11.5px", fontWeight: 600, color: "#fff", flexShrink: 0
        }}>
          {user ? initialsOf(user) : "RB"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>
            {user?.name || "Ruben B."}
          </div>
          <div style={{ fontSize: "10.5px", color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.email || "ruben@rubenius.in"}
          </div>
        </div>
        <button
          title="Log out"
          style={{
            width: "30px", height: "30px", borderRadius: "7px",
            border: "1px solid var(--line2)", background: "transparent",
            color: "var(--mut)", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "all 150ms"
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
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

export function TopBar({
  stages: _stages, stage: _stage, reached: _reached, onJump: _onJump, status: _status, title, theme, onTheme, actions: _actions,
  isPaused, onTogglePause
}: {
  stages: Stage[] | null; stage: string; reached: string[]; onJump: (key: string) => void;
  status: string | null; title: string; theme: string; onTheme: () => void; actions?: ReactNode;
  isPaused?: boolean; onTogglePause?: () => void;
}) {
  void _stages;
  void _stage;
  void _reached;
  void _onJump;
  void _status;
  void _actions;
  const [armed, setArmed] = useState(false);

  const triggerPause = () => {
    if (onTogglePause) {
      if (isPaused) {
        setArmed(false);
        onTogglePause();
      } else if (!armed) {
        setArmed(true);
        setTimeout(() => setArmed(false), 4000);
      } else {
        setArmed(false);
        onTogglePause();
      }
    }
  };

  const pauseLabel = isPaused ? 'Publishing paused' : (armed ? 'Confirm pause?' : 'Pause publishing');
  const pauseBg = isPaused || armed ? 'var(--redbg)' : 'transparent';
  const pauseFg = isPaused || armed ? 'var(--red)' : 'var(--mut)';
  const pauseBorder = isPaused || armed ? 'var(--red)' : 'var(--line2)';

  return (
    <header style={{
      height: "58px", flexShrink: 0, borderBottom: "1px solid var(--line)",
      background: "var(--panel)", display: "flex", alignItems: "center",
      gap: "14px", padding: "0 20px"
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.1, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: "10.5px", color: "var(--faint)" }}>Sat, Jul 18 2026 · IST (UTC+5:30)</div>
      </div>
      
      <div style={{ height: "26px", width: "1px", background: "var(--line)", margin: "0 2px" }}></div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--mut)", background: "var(--card2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "5px 11px" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--grn)" }}></span>All systems operational
      </div>
      
      <div style={{ flex: 1 }}></div>

      {/* Search Input */}
      <div style={{ display: "flex", alignItems: "center", background: "var(--card2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "0 10px", gap: "8px", height: "34px", width: "200px" }}>
        <span style={{ color: "var(--faint)", fontSize: "13px" }}>⌕</span>
        <input placeholder="Search posts, topics…" style={{ flex: 1, minWidth: 0, font: "inherit", fontSize: "12px", border: "none", background: "transparent", color: "var(--text)", outline: "none" }} />
        <span style={{ fontSize: "10px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--faint)", border: "1px solid var(--line2)", borderRadius: "4px", padding: "1px 5px" }}>⌘K</span>
      </div>

      {/* Notification Icon */}
      <button title="Notifications" style={{ position: "relative", width: "34px", height: "34px", borderRadius: "8px", border: "1px solid var(--line2)", background: "transparent", color: "var(--mut)", cursor: "pointer", fontSize: "14px" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span style={{ position: "absolute", top: "6px", right: "7px", width: "7px", height: "7px", borderRadius: "50%", background: "var(--amb)", border: "1.5px solid var(--panel)" }}></span>
      </button>

      <div style={{ height: "26px", width: "1px", background: "var(--line)" }}></div>

      {/* Pause publishing button */}
      <button onClick={triggerPause} style={{ display: "flex", alignItems: "center", gap: "7px", font: "inherit", fontSize: "12px", fontWeight: 600, padding: "7px 13px", borderRadius: "8px", border: `1px solid ${pauseBorder}`, background: pauseBg, color: pauseFg, cursor: "pointer", transition: "all 130ms" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "currentColor" }}></span>
        {pauseLabel}
      </button>

      {/* Create campaign button */}
      <button style={{ font: "inherit", fontSize: "12px", fontWeight: 600, padding: "7px 14px", borderRadius: "8px", border: "none", background: "var(--acc)", color: "#08111f", cursor: "pointer" }}>+ Create campaign</button>

      {/* Theme Toggler */}
      <button onClick={onTheme} title="Toggle theme" style={{ width: "34px", height: "34px", font: "inherit", fontSize: "13px", borderRadius: "8px", border: "1px solid var(--line2)", background: "transparent", color: "var(--mut)", cursor: "pointer" }}>
        {theme === 'dark' ? '☀' : '☾'}
      </button>
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
