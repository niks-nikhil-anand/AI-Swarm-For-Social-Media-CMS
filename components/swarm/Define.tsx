"use client";
/* ============================================================
   SWARM — Stage 1: Define
   ============================================================ */
import { useState, type CSSProperties, type ReactNode } from "react";
import { Icon, Btn, Card, Badge, Segmented } from "./ui";
import { FORMATS, type OutputFormat } from "./data";

function FormatCard({ fmt, selected, onClick }: { fmt: OutputFormat; selected: boolean; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 10, padding: 14, textAlign: "left", cursor: "pointer",
        borderRadius: "var(--r-md)", fontFamily: "var(--font)",
        background: selected ? "var(--accent-soft)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--accent-line)" : h ? "var(--border-strong)" : "var(--border)"}`,
        boxShadow: selected ? "0 0 0 1px var(--accent-line), 0 8px 24px -12px var(--accent-glow)" : "var(--shadow-sm)",
        transform: h && !selected ? "translateY(-2px)" : "none", transition: "all 150ms cubic-bezier(0.22,1,0.36,1)",
        position: "relative",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", justifyContent: "center", background: selected ? "var(--accent)" : "var(--elevated)", color: selected ? "var(--on-accent)" : "var(--muted)", border: selected ? "none" : "1px solid var(--border)" }}>
          <Icon name={fmt.icon} size={17} />
        </div>
        <span style={{ width: 18, height: 18, borderRadius: 999, border: `1.5px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: selected ? "var(--accent)" : "transparent" }}>
          {selected && <Icon name="check" size={11} color="#fff" />}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{fmt.label}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{fmt.desc}</div>
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}
const advInput: CSSProperties = {
  height: 36, width: "100%", padding: "0 12px", borderRadius: "var(--r-sm)",
  background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)",
  fontFamily: "var(--font)", fontSize: 13.5, outline: "none", boxSizing: "border-box",
};

export function Define({ onPropose }: { onPropose: () => void }) {
  const [topic, setTopic] = useState("Research the impact of quantum computing on cryptography and produce a 10-slide PowerPoint for a security leadership audience.");
  const [fmt, setFmt] = useState("pptx");
  const [adv, setAdv] = useState(false);
  const [tone, setTone] = useState("Executive");
  const [length, setLength] = useState("10 slides");
  const valid = topic.trim().length > 12;

  return (
    <div style={{ overflow: "auto", height: "100%", padding: "40px 24px 120px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="rise" style={{ marginBottom: 28 }}>
          <Badge tone="accent" icon="wand">New project</Badge>
          <h1 className="h1" style={{ marginTop: 14 }}>What should the swarm research?</h1>
          <p className="muted" style={{ fontSize: 15, marginTop: 6, maxWidth: 560 }}>
            Describe the goal in plain language. An orchestrator will propose a team of specialist agents for you to approve.
          </p>
        </div>

        <div className="rise" style={{ marginBottom: 24 }}>
          <label className="h4" style={{ display: "block", marginBottom: 10 }}>Research goal</label>
          <div style={{ position: "relative" }}>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={4}
              placeholder="e.g. Analyze the competitive landscape for vector databases and write a PDF report…"
              style={{
                width: "100%", resize: "vertical", minHeight: 110, padding: "14px 16px", borderRadius: "var(--r-md)",
                background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)",
                fontFamily: "var(--font)", fontSize: 15, lineHeight: 1.55, outline: "none", boxShadow: "var(--shadow-sm)",
              }} />
            <div style={{ position: "absolute", right: 12, bottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
              <span className="faint mono" style={{ fontSize: 11 }}>{topic.length} chars</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span className="faint" style={{ fontSize: 12, alignSelf: "center" }}>Try:</span>
            {["State of AI agents 2026", "Vector DB teardown", "Stablecoin regulation scan"].map((s) => (
              <button key={s} onClick={() => setTopic(s)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: "var(--r-pill)", background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font)" }}>{s}</button>
            ))}
          </div>
        </div>

        <div className="rise" style={{ marginBottom: 24 }}>
          <label className="h4" style={{ display: "block", marginBottom: 10 }}>Output format</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {FORMATS.map((f) => <FormatCard key={f.id} fmt={f} selected={fmt === f.id} onClick={() => setFmt(f.id)} />)}
          </div>
        </div>

        <div className="rise" style={{ marginBottom: 28 }}>
          <button onClick={() => setAdv(!adv)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", fontFamily: "var(--font)", fontSize: 13.5, fontWeight: 600, padding: "4px 0" }}>
            <Icon name={adv ? "chevron-down" : "chevron-right"} size={16} />
            Advanced settings
            <span className="faint" style={{ fontWeight: 400, fontSize: 12.5 }}>tone, audience, length, sources</span>
          </button>
          {adv && (
            <Card style={{ marginTop: 12, padding: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Field label="Tone">
                  <Segmented options={["Executive", "Technical", "Neutral"]} value={tone} onChange={setTone} size="sm" />
                </Field>
                <Field label="Length">
                  <Segmented options={["6 slides", "10 slides", "16 slides"]} value={length} onChange={setLength} size="sm" />
                </Field>
                <Field label="Target audience">
                  <input defaultValue="CISO, security leadership, board" style={advInput} />
                </Field>
                <Field label="Must-include sources">
                  <input defaultValue="NIST, NCSC" placeholder="comma separated domains" style={advInput} />
                </Field>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Custom instructions">
                    <textarea rows={2} defaultValue="Prefer probability framing over fixed dates. Cite every quantitative claim." style={{ ...advInput, height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }} />
                  </Field>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div style={{ position: "sticky", bottom: 0, left: 0, right: 0, marginTop: 8 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="glass-strong" style={{ borderRadius: "var(--r-lg)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--shadow-md)" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {valid
                ? <><Icon name="check-circle-fill" size={16} color="var(--st-done)" /><span style={{ fontSize: 13, color: "var(--text-2)" }}>Ready — goal and format set</span></>
                : <><Icon name="alert-circle" size={16} color="var(--st-blocked)" /><span style={{ fontSize: 13, color: "var(--muted)" }}>Describe the research goal to continue</span></>}
            </div>
            <Btn kind="primary" size="lg" icon="wand" disabled={!valid} onClick={onPropose}>Propose agent team</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
