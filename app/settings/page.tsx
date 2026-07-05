"use client";
/* ============================================================
   SWARM — Settings (standalone route)
   ============================================================ */
import { useState, useEffect, useCallback, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, IconBtn, Badge, Card, Segmented, Toggle } from "../../components/swarm/ui";
import { Sidebar, TopBar } from "../../components/swarm/Shell";
import { PROVIDERS, DEFAULT_AGENT_ROSTER, type Agent } from "../../components/swarm/data";

const SIDEBAR_ROUTES: Record<string, string> = { settings: "/settings", dashboard: "/dashboard", history: "/projects", skills: "/skills" };

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

const mInput: CSSProperties = { height: 40, width: "100%", padding: "0 12px", borderRadius: "var(--r-sm)", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font)", fontSize: 14, outline: "none", boxSizing: "border-box" };

function depNames(deps: string[], all: Agent[]) {
  return deps.map((d) => (all.find((a) => a.id === d) || ({} as Partial<Agent>)).short).filter(Boolean) as string[];
}

const AGENT_ICONS = ["target", "globe", "bar-chart", "shield", "edit", "layers", "wand", "user", "database", "zap", "star", "box"];
const AGENT_ACCENTS: [string, string][] = [["var(--blue)", "#3B82F6"], ["var(--purple)", "#A855F7"], ["var(--cyan)", "#22D3EE"], ["var(--st-done)", "#22C55E"]];

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
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

/* ---------- Agent roster card ---------- */
function SettingsAgentCard({ agent, all, onEdit, onDelete }: {
  agent: Agent; all: Agent[]; onEdit: (patch: Partial<Agent>) => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(agent.name);
  const [why, setWhy] = useState(agent.why);
  const deps = depNames(agent.deps, all);
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", border: "1px solid var(--border)", color: agent.accent }}>
          <Icon name={agent.icon} size={19} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", height: 28, padding: "0 8px", borderRadius: 6, background: "var(--bg-2)", border: "1px solid var(--accent-line)", color: "var(--text)", fontFamily: "var(--font)", fontSize: 14, fontWeight: 600, outline: "none" }} />
          ) : (
            <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.25 }}>{name}</span>
          )}
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{agent.role}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
          <IconBtn name="edit" size={28} title={editing ? "Save" : "Edit agent"} active={editing} onClick={() => { if (editing) onEdit({ name, why }); setEditing(!editing); }} />
          <IconBtn name="trash" size={28} title="Remove agent" onClick={onDelete} />
        </div>
      </div>
      {editing ? (
        <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} style={{ width: "100%", marginTop: 12, padding: "8px 10px", borderRadius: 6, background: "var(--bg-2)", border: "1px solid var(--accent-line)", color: "var(--text-2)", fontFamily: "var(--font)", fontSize: 13, lineHeight: 1.5, resize: "vertical", outline: "none" }} />
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 12, lineHeight: 1.55 }}>{why}</p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {deps.length === 0 ? (
          <Badge tone="accent" icon="play">Runs first</Badge>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
            <Icon name="git-branch" size={13} color="var(--faint)" />
            after
            {deps.map((d) => (
              <span key={d} style={{ fontFamily: "var(--mono)", fontSize: 11, padding: "1px 7px", borderRadius: "var(--r-pill)", background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{d}</span>
            ))}
          </span>
        )}
      </div>
    </Card>
  );
}

function AddAgentModal({ roster, onClose, onAdd }: { roster: Agent[]; onClose: () => void; onAdd: (a: Agent) => void }) {
  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [role, setRole] = useState("Custom");
  const [why, setWhy] = useState("");
  const [icon, setIcon] = useState("user");
  const [accent, setAccent] = useState(AGENT_ACCENTS[0][0]);
  const [deps, setDeps] = useState<string[]>([]);

  function toggleDep(id: string) {
    setDeps((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function submit() {
    const id = "custom-" + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + roster.length;
    onAdd({ id, name: name.trim(), short: short.trim() || name.trim().split(" ")[0], icon, accent, role: role.trim() || "Custom", why: why.trim() || "Custom specialist added by you.", deps, layer: deps.length ? Math.max(...deps.map((d) => (roster.find((a) => a.id === d)?.layer ?? 0))) + 1 : 0 });
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--scrim)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong rise" style={{ width: 520, maxWidth: "92vw", maxHeight: "88vh", overflow: "auto", borderRadius: "var(--r-xl)", padding: 24, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={17} /></div>
            <h3 className="h3">Add agent</h3>
          </div>
          <IconBtn name="x" size={30} title="Close" onClick={onClose} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Regulatory Specialist" style={mInput} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Short label</div>
              <input value={short} onChange={(e) => setShort(e.target.value)} placeholder="Reg" style={mInput} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Role</div>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Compliance" style={mInput} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Why it&apos;s needed</div>
            <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} placeholder="What does this agent contribute to the goal?" style={{ ...mInput, height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Icon</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {AGENT_ICONS.map((ic) => (
                <IconBtn key={ic} name={ic} title={ic} active={icon === ic} onClick={() => setIcon(ic)} />
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Accent color</div>
            <div style={{ display: "flex", gap: 8 }}>
              {AGENT_ACCENTS.map(([id, c]) => (
                <button key={id} onClick={() => setAccent(id)} title={id} style={{ width: 28, height: 28, borderRadius: 999, background: c, border: accent === id ? "2px solid var(--text)" : "2px solid transparent", boxShadow: accent === id ? `0 0 0 2px var(--bg), 0 0 10px ${c}` : "none", cursor: "pointer" }} />
              ))}
            </div>
          </div>
          {roster.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Depends on</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {roster.map((a) => {
                  const active = deps.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggleDep(a.id)} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: "var(--r-pill)", cursor: "pointer", fontFamily: "var(--font)",
                      background: active ? "var(--accent-soft)" : "var(--elevated)", border: `1px solid ${active ? "var(--accent-line)" : "var(--border)"}`,
                      color: active ? "var(--accent-2)" : "var(--text-2)", fontSize: 12.5, fontWeight: 600,
                    }}>
                      <Icon name={a.icon} size={13} />{a.short}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22 }}>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="plus" disabled={!name.trim()} onClick={submit}>Add agent</Btn>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
    r.setAttribute("data-density", t.density);
    r.style.setProperty("--mo", String((t.motion ?? 60) / 100));
  }, [t.theme, t.accent, t.density, t.motion]);

  const [providerId, setProviderId] = useState("anthropic");
  const provider = PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0];
  const [model, setModel] = useState(provider.models[0]?.id ?? "");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState(provider.defaultBaseUrl ?? "");

  function selectProvider(id: string) {
    setProviderId(id);
    const p = PROVIDERS.find((x) => x.id === id) || PROVIDERS[0];
    setModel(p.models[0]?.id ?? "");
    setBaseUrl(p.defaultBaseUrl ?? "");
  }

  const [search, setSearch] = useState("brave");
  const [roster, setRoster] = useState<Agent[]>(DEFAULT_AGENT_ROSTER);
  const [modal, setModal] = useState(false);

  const backHome = () => router.push("/");

  return (
    <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
      <Sidebar view="settings" activeSession={null}
        onNew={backHome} onGo={({ view }) => router.push(SIDEBAR_ROUTES[view] || "/")} onOpenSession={backHome} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar stages={null} stage="settings" reached={["settings"]} onJump={() => {}} status={null} title="Settings" theme={t.theme} onTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")} />
        <div style={{ overflow: "auto", height: "100%", padding: "32px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h1 className="h1" style={{ marginBottom: 4 }}>Settings</h1>
            <p className="muted" style={{ fontSize: 14.5, marginBottom: 24 }}>Configure providers, agents, appearance and your account.</p>

            <Card style={{ padding: "4px 20px", marginBottom: 18 }}>
              <div style={{ padding: "16px 0 8px" }}><span className="eyebrow">Intelligence</span></div>
              <SettingRow label="LLM provider" desc="Model powering the orchestrator and agents.">
                <ProviderPick value={providerId} onChange={selectProvider} options={PROVIDERS.map((p) => ({ id: p.id, label: p.label, icon: p.icon }))} />
              </SettingRow>
              <SettingRow label="Model" desc={provider.desc}>
                {provider.models.length > 0 ? (
                  <select value={model} onChange={(e) => setModel(e.target.value)} style={{ ...mInput, width: 240, height: 36 }}>
                    {provider.models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                ) : (
                  <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="model id" style={{ ...mInput, width: 240, height: 36 }} />
                )}
              </SettingRow>
              <SettingRow label="API key" desc="Stored encrypted; never sent to the browser.">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={provider.keyPlaceholder} style={{ ...mInput, width: 220, height: 36, fontFamily: "var(--mono)", fontSize: 12.5 }} />
                  <IconBtn name="eye" size={36} title={showKey ? "Hide key" : "Show key"} active={showKey} onClick={() => setShowKey(!showKey)} />
                </div>
              </SettingRow>
              {provider.kind !== "hosted" && (
                <SettingRow label="Base URL" desc="Endpoint for this provider.">
                  <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={provider.defaultBaseUrl || "https://…"} style={{ ...mInput, width: 260, height: 36, fontFamily: "var(--mono)", fontSize: 12.5 }} />
                </SettingRow>
              )}
              <SettingRow label="Search provider" desc="Used by the Web Researcher for live retrieval.">
                <ProviderPick value={search} onChange={setSearch} options={[{ id: "serpapi", label: "SerpAPI", icon: "search" }, { id: "brave", label: "Brave", icon: "globe" }]} />
              </SettingRow>
            </Card>

            <Card style={{ padding: "4px 20px", marginBottom: 18 }}>
              <div style={{ padding: "16px 0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span className="eyebrow">Agent roster</span>
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Your default team. Each new project starts a proposal from this roster.</p>
                </div>
                <Btn kind="secondary" size="sm" icon="plus" onClick={() => setModal(true)}>Add agent</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, padding: "12px 0 16px" }}>
                {roster.map((a) => (
                  <SettingsAgentCard key={a.id} agent={a} all={roster}
                    onEdit={(patch) => setRoster((prev) => prev.map((x) => x.id === a.id ? { ...x, ...patch } : x))}
                    onDelete={() => setRoster((prev) => prev.filter((x) => x.id !== a.id))} />
                ))}
              </div>
            </Card>

            <Card style={{ padding: "4px 20px", marginBottom: 18 }}>
              <div style={{ padding: "16px 0 8px" }}><span className="eyebrow">Appearance</span></div>
              <SettingRow label="Theme" desc="Dark is recommended for the live execution view.">
                <Segmented<string> options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} value={t.theme} onChange={(v) => { if (v !== t.theme) setTweak("theme", v); }} />
              </SettingRow>
              <SettingRow label="Accent color" desc="Used across the graph, links and primary actions.">
                <div style={{ display: "flex", gap: 8 }}>
                  {([["blue", "#3B82F6"], ["purple", "#A855F7"], ["cyan", "#22D3EE"], ["steel", "#2e74bf"]] as [string, string][]).map(([id, c]) => (
                    <button key={id} onClick={() => setTweak("accent", id)} title={id} style={{ width: 30, height: 30, borderRadius: 999, background: c, border: t.accent === id ? "2px solid var(--text)" : "2px solid transparent", boxShadow: t.accent === id ? `0 0 0 2px var(--bg), 0 0 12px ${c}` : "none", cursor: "pointer" }} />
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
                <Btn kind="danger" icon="lock" onClick={backHome}>Sign out</Btn>
              </SettingRow>
            </Card>
            <div style={{ height: 40 }} />
          </div>
        </div>
      </main>
      {modal && <AddAgentModal roster={roster} onClose={() => setModal(false)} onAdd={(a) => { setRoster((prev) => [...prev, a]); setModal(false); }} />}
    </div>
  );
}
