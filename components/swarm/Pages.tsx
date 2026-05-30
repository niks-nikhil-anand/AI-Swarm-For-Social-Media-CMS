"use client";
/* ============================================================
   SWARM — History + Settings
   ============================================================ */
import { useState, type ReactNode } from "react";
import { Icon, Btn, IconBtn, Badge, Card, Segmented, Toggle, StatusDot, Empty } from "./ui";
import { HISTORY, type Project } from "./data";

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
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35, minHeight: 36, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.title}</div>
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

export function History({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [empty, setEmpty] = useState(false);
  return (
    <div style={{ overflow: "auto", height: "100%", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 className="h1">Projects</h1>
            <p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>{HISTORY.length} projects · 1 running</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Segmented<"grid" | "list"> size="sm" options={[{ value: "grid", label: "Grid", icon: "grid" }, { value: "list", label: "List", icon: "list" }]} value={view} onChange={setView} />
            <Btn kind="ghost" size="sm" onClick={() => setEmpty(!empty)}>{empty ? "Show projects" : "Preview empty"}</Btn>
            <Btn kind="primary" icon="plus" onClick={onNew}>New project</Btn>
          </div>
        </div>

        {empty ? (
          <Card style={{ padding: 0 }}>
            <Empty icon="folder" title="No projects yet" body="Set a research goal and the swarm will assemble a team, do the work, and hand you a finished file." action={<Btn kind="primary" icon="wand" onClick={onNew}>Start your first project</Btn>} />
          </Card>
        ) : view === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {HISTORY.map((p) => <HistoryCard key={p.id} p={p} onOpen={onOpen} />)}
          </div>
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {HISTORY.map((p, i) => {
              const st = HSTATUS[p.status];
              return (
                <div key={p.id} onClick={() => onOpen(p.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderTop: i ? "1px solid var(--border-soft)" : "none", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--elevated)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", color: p.accent }}><Icon name={p.fmtIcon} size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{p.fmt} · {p.agents} agents · {p.date}</div>
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
  );
}

/* ---------- Settings ---------- */
function SettingRow({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--border-soft)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {desc && <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}
function ProviderPick({ options, value, onChange }: { options: { id: string; label: string; icon: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--r-sm)", cursor: "pointer", fontFamily: "var(--font)",
            background: active ? "var(--accent-soft)" : "var(--elevated)", border: `1px solid ${active ? "var(--accent-line)" : "var(--border)"}`,
            color: active ? "var(--accent-2)" : "var(--text-2)", fontSize: 13, fontWeight: 600,
          }}>
            <Icon name={o.icon} size={15} />{o.label}
            {active && <Icon name="check" size={13} color="var(--accent-2)" />}
          </button>
        );
      })}
    </div>
  );
}
function NotifToggle() { const [on, setOn] = useState(true); return <Toggle on={on} onChange={setOn} />; }

export function Settings({ theme, onTheme, accent, onAccent }: {
  theme: string; onTheme: () => void; accent: string; onAccent: (a: string) => void;
}) {
  const [llm, setLlm] = useState("anthropic");
  const [search, setSearch] = useState("brave");
  return (
    <div style={{ overflow: "auto", height: "100%", padding: "32px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 className="h1" style={{ marginBottom: 4 }}>Settings</h1>
        <p className="muted" style={{ fontSize: 14.5, marginBottom: 24 }}>Configure providers, appearance and your account.</p>

        <Card style={{ padding: "4px 20px", marginBottom: 18 }}>
          <div style={{ padding: "16px 0 8px" }}><span className="eyebrow">Intelligence</span></div>
          <SettingRow label="LLM provider" desc="Model powering the orchestrator and agents.">
            <ProviderPick value={llm} onChange={setLlm} options={[{ id: "anthropic", label: "Anthropic", icon: "wand" }, { id: "openai", label: "OpenAI", icon: "zap" }, { id: "oss", label: "Open-source", icon: "server" }]} />
          </SettingRow>
          <SettingRow label="Search provider" desc="Used by the Web Researcher for live retrieval.">
            <ProviderPick value={search} onChange={setSearch} options={[{ id: "serpapi", label: "SerpAPI", icon: "search" }, { id: "brave", label: "Brave", icon: "globe" }]} />
          </SettingRow>
          <SettingRow label="API key" desc="Stored encrypted; never sent to the browser.">
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)" }}><Icon name="key" size={14} color="var(--faint)" />sk-ant-•••••••••••4f2a</div>
          </SettingRow>
        </Card>

        <Card style={{ padding: "4px 20px", marginBottom: 18 }}>
          <div style={{ padding: "16px 0 8px" }}><span className="eyebrow">Appearance</span></div>
          <SettingRow label="Theme" desc="Dark is recommended for the live execution view.">
            <Segmented<string> options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} value={theme} onChange={(v) => { if (v !== theme) onTheme(); }} />
          </SettingRow>
          <SettingRow label="Accent color" desc="Used across the graph, links and primary actions.">
            <div style={{ display: "flex", gap: 8 }}>
              {([["blue", "#3B82F6"], ["purple", "#A855F7"], ["cyan", "#22D3EE"], ["steel", "#2e74bf"]] as [string, string][]).map(([id, c]) => (
                <button key={id} onClick={() => onAccent(id)} title={id} style={{ width: 30, height: 30, borderRadius: 999, background: c, border: accent === id ? "2px solid var(--text)" : "2px solid transparent", boxShadow: accent === id ? `0 0 0 2px var(--bg), 0 0 12px ${c}` : "none", cursor: "pointer" }} />
              ))}
            </div>
          </SettingRow>
        </Card>

        <Card style={{ padding: "4px 20px" }}>
          <div style={{ padding: "16px 0 8px" }}><span className="eyebrow">Account</span></div>
          <SettingRow label="Avery Chen" desc="avery@anthropic.com · Pro plan">
            <div style={{ width: 38, height: 38, borderRadius: 999, background: "linear-gradient(135deg, var(--accent-2), var(--accent))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>AC</div>
          </SettingRow>
          <SettingRow label="Notifications" desc="Email me when a long-running swarm finishes.">
            <NotifToggle />
          </SettingRow>
          <SettingRow label="Sign out" desc="End this session on all devices.">
            <Btn kind="danger" icon="lock">Sign out</Btn>
          </SettingRow>
        </Card>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
