"use client";
/* ============================================================
   SWARM — Stage 2: Roles (suggestion & approval)
   ============================================================ */
import { Fragment, useState, type CSSProperties } from "react";
import { Icon, Btn, Card, Badge, Toggle, IconBtn } from "./ui";
import { AGENTS, type Agent } from "./data";

function depNames(deps: string[], all: Agent[]) {
  return deps.map((d) => (all.find((a) => a.id === d) || ({} as Partial<Agent>)).short).filter(Boolean) as string[];
}

function RoleCard({ agent, all, approved, onToggle, onEdit }: {
  agent: Agent; all: Agent[]; approved: boolean; onToggle: () => void; onEdit?: (patch: Partial<Agent>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(agent.name);
  const [why, setWhy] = useState(agent.why);
  const deps = depNames(agent.deps, all);
  return (
    <Card style={{
      padding: 16, opacity: approved ? 1 : 0.55, position: "relative",
      borderColor: approved ? "var(--border-strong)" : "var(--border)",
      transition: "opacity 180ms",
    }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", border: "1px solid var(--border)", color: agent.accent, boxShadow: `0 0 0 1px color-mix(in oklab, ${agent.accent} 22%, transparent)` }}>
          <Icon name={agent.icon} size={19} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", height: 28, padding: "0 8px", borderRadius: 6, background: "var(--bg-2)", border: "1px solid var(--accent-line)", color: "var(--text)", fontFamily: "var(--font)", fontSize: 14, fontWeight: 600, outline: "none" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.25 }}>{name}</span>
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{agent.role}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
          <IconBtn name="edit" size={28} title={editing ? "Save" : "Edit role"} active={editing} onClick={() => { if (editing) onEdit?.({ name, why }); setEditing(!editing); }} />
          <Toggle on={approved} onChange={onToggle} />
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

function FlowPreview({ agents, approvedIds }: { agents: Agent[]; approvedIds: string[] }) {
  const layers: Record<number, Agent[]> = {};
  agents.forEach((a) => { if (!approvedIds.includes(a.id)) return; (layers[a.layer] = layers[a.layer] || []).push(a); });
  const keys = Object.keys(layers).map(Number).sort((x, y) => x - y);
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon name="git-branch" size={15} color="var(--accent)" />
        <span className="h4">Team flow</span>
        <span className="faint" style={{ fontSize: 12 }}>findings flow left → right</span>
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0, overflowX: "auto", paddingBottom: 6 }}>
        {keys.map((k, i) => (
          <Fragment key={k}>
            {i > 0 && (
              <div style={{ display: "flex", alignItems: "center", padding: "0 8px", color: "var(--border-strong)" }}>
                <Icon name="chevron-right" size={16} color="var(--accent-line)" />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
              {layers[k].map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px 6px 8px", borderRadius: "var(--r-pill)", background: "var(--elevated)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-2)", color: a.accent }}><Icon name={a.icon} size={13} /></span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>{a.short}</span>
                </div>
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </Card>
  );
}

const mInput: CSSProperties = { height: 40, width: "100%", padding: "0 12px", borderRadius: "var(--r-sm)", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font)", fontSize: 14, outline: "none", boxSizing: "border-box" };

function AddRoleModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: { name: string; why: string }) => void }) {
  const [name, setName] = useState("");
  const [why, setWhy] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--scrim)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong rise" style={{ width: 460, maxWidth: "92vw", borderRadius: "var(--r-xl)", padding: 24, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={17} /></div>
            <h3 className="h3">Add a custom role</h3>
          </div>
          <IconBtn name="x" size={30} title="Close" onClick={onClose} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Role name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Regulatory Specialist" style={mInput} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Why it&apos;s needed</div>
            <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} placeholder="What does this agent contribute to the goal?" style={{ ...mInput, height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22 }}>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="plus" disabled={!name.trim()} onClick={() => onAdd({ name, why })}>Add role</Btn>
        </div>
      </div>
    </div>
  );
}

export function Roles({ onLaunch }: { onLaunch: () => void }) {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [approved, setApproved] = useState<string[]>(() => AGENTS.map((a) => a.id));
  const [modal, setModal] = useState(false);
  const count = approved.length;

  function toggle(id: string) {
    setApproved((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function addRole({ name, why }: { name: string; why: string }) {
    const id = "custom-" + Date.now();
    const newAgent: Agent = { id, name, short: name.split(" ")[0], icon: "user", accent: "var(--cyan)", role: "Custom", why: why || "Custom specialist added by you.", deps: ["lead"], layer: 1 };
    setAgents((p) => [...p, newAgent]);
    setApproved((p) => [...p, id]);
    setModal(false);
  }

  return (
    <div style={{ overflow: "auto", height: "100%", padding: "32px 24px 120px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div className="rise" style={{ display: "flex", alignItems: "flex-end", marginBottom: 20, gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div>
            <Badge tone="accent" icon="wand">Proposed by orchestrator</Badge>
            <h1 className="h1" style={{ marginTop: 12 }}>Approve your agent team</h1>
            <p className="muted" style={{ fontSize: 15, marginTop: 6, maxWidth: 600 }}>
              The Lead Researcher proposed {agents.length} specialists for this goal. Toggle any off, edit a role, or add your own. Dependencies are inferred automatically.
            </p>
          </div>
          <Btn kind="secondary" icon="plus" onClick={() => setModal(true)}>Add custom role</Btn>
        </div>

        <div className="rise" style={{ marginBottom: 20 }}>
          <FlowPreview agents={agents} approvedIds={approved} />
        </div>

        <div className="rise" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 14 }}>
          {agents.map((a) => (
            <RoleCard key={a.id} agent={a} all={agents} approved={approved.includes(a.id)}
              onToggle={() => toggle(a.id)}
              onEdit={(patch) => setAgents((prev) => prev.map((x) => x.id === a.id ? { ...x, ...patch } : x))} />
          ))}
        </div>
      </div>

      <div style={{ position: "sticky", bottom: 0, marginTop: 16 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="glass-strong" style={{ borderRadius: "var(--r-lg)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex" }}>
                {agents.filter((a) => approved.includes(a.id)).slice(0, 7).map((a, i) => (
                  <div key={a.id} style={{ width: 28, height: 28, borderRadius: 999, background: "var(--elevated-2)", border: "1.5px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", color: a.accent, marginLeft: i ? -8 : 0 }}><Icon name={a.icon} size={13} /></div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}><span className="tabular">{count}</span> agent{count !== 1 ? "s" : ""} approved</div>
                <div className="faint" style={{ fontSize: 12 }}>{count < 2 ? "Approve at least 2 to launch" : "Estimated run · 2–4 min"}</div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <Btn kind="primary" size="lg" icon="play" iconRight="arrow-right" disabled={count < 2} onClick={onLaunch}>Launch swarm</Btn>
          </div>
        </div>
      </div>

      {modal && <AddRoleModal onClose={() => setModal(false)} onAdd={addRole} />}
    </div>
  );
}
