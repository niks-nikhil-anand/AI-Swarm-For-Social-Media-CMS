"use client";
/* ============================================================
   SWARM — Stage 1: Define
   ============================================================ */
import { useState, useEffect, useRef, type CSSProperties, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Icon, Btn, Badge, Segmented } from "./ui";
import { FORMATS, type OutputFormat } from "./data";

const SUGGESTIONS = [
  { icon: "bar-chart", label: "State of AI agents 2026" },
  { icon: "layers", label: "Vector DB teardown" },
  { icon: "shield", label: "Stablecoin regulation scan" },
];

const GOAL_MIN = 80;
const GOAL_MAX = 150;

function FormatCard({ fmt, selected, onClick }: { fmt: OutputFormat; selected: boolean; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      role="radio"
      aria-checked={selected}
      aria-label={`Select ${fmt.label} — ${fmt.desc}`}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 12, padding: 14, textAlign: "left", cursor: "pointer",
        borderRadius: selected ? "var(--r-lg)" : "var(--r-md)", fontFamily: "var(--font)",
        background: selected
          ? "linear-gradient(180deg, color-mix(in oklab, var(--accent) 13%, var(--surface)) 0%, color-mix(in oklab, var(--accent) 6%, var(--surface)) 100%)"
          : h ? "var(--elevated)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--accent-line)" : h ? "var(--border-strong)" : "var(--border)"}`,
        boxShadow: selected
          ? "0 0 0 1px var(--accent-line), 0 12px 32px -14px var(--accent-glow), 0 1px 0 var(--glass-hi) inset"
          : h ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: h && !selected ? "translateY(-2px)" : "none",
        transition: "transform 160ms cubic-bezier(0.22,1,0.36,1), background 160ms, border-color 160ms, box-shadow 200ms, border-radius 200ms",
        position: "relative", outlineOffset: 3,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", justifyContent: "center",
          background: selected ? "var(--accent)" : "var(--elevated)",
          color: selected ? "var(--on-accent)" : h ? "var(--text-2)" : "var(--muted)",
          border: selected ? "1px solid transparent" : "1px solid var(--border)",
          boxShadow: selected ? "0 6px 16px -6px var(--accent-glow)" : "none",
          transition: "background 160ms, color 160ms, box-shadow 200ms",
        }}>
          <Icon name={fmt.icon} size={18} />
        </div>
        <span aria-hidden="true" style={{
          width: 20, height: 20, borderRadius: 999, flexShrink: 0,
          border: `1.5px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: selected ? "var(--accent)" : "transparent",
          transition: "transform 180ms cubic-bezier(0.34,1.56,0.64,1), background 160ms, border-color 160ms, opacity 160ms",
          transform: selected ? "scale(1)" : "scale(0.85)",
          opacity: selected ? 1 : h ? 0.9 : 0.55,
        }}>
          {selected && <Icon name="check" size={12} color="var(--on-accent)" />}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{fmt.label}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 }}>{fmt.desc}</div>
      </div>
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8, letterSpacing: "0.01em" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11.5, marginTop: 6, color: "var(--muted)" }}>{hint}</div>}
    </div>
  );
}

const advInput: CSSProperties = {
  height: 36, width: "100%", padding: "0 12px", borderRadius: "var(--r-sm)",
  background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)",
  fontFamily: "var(--font)", fontSize: 13.5, outline: "none", boxSizing: "border-box",
  transition: "border-color 160ms, box-shadow 160ms",
};

function useFocusRing() {
  const [f, setF] = useState(false);
  const style: CSSProperties = f
    ? { borderColor: "var(--accent)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)" }
    : {};
  return { style, onFocus: () => setF(true), onBlur: () => setF(false) };
}

function AdvInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const ring = useFocusRing();
  return <input {...props} onFocus={ring.onFocus} onBlur={ring.onBlur} style={{ ...advInput, ...ring.style, ...props.style }} />;
}
function AdvTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ring = useFocusRing();
  return <textarea {...props} onFocus={ring.onFocus} onBlur={ring.onBlur}
    style={{ ...advInput, height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5, ...ring.style, ...props.style }} />;
}

/* ---------- Advanced settings drawer ---------- */
function AdvancedDrawer({
  open, onClose, tone, setTone, length, setLength,
}: {
  open: boolean; onClose: () => void;
  tone: string; setTone: (v: string) => void;
  length: string; setLength: (v: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 90, background: "var(--scrim)",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity 220ms ease",
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Advanced settings"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 91,
          width: "min(380px, 92vw)", background: "var(--surface)", borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-pop)", display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 260ms cubic-bezier(0.22,1,0.36,1)",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border-soft)" }}>
          <div>
            <div className="h4">Advanced settings</div>
            <div style={{ fontSize: 12, marginTop: 2, color: "var(--muted)" }}>Tone, audience, length, sources</div>
          </div>
          <button onClick={onClose} aria-label="Close advanced settings" style={{
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
            color: "var(--muted)", cursor: "pointer",
          }}>
            <Icon name="x" size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          <Field label="Tone">
            <Segmented options={["Executive", "Technical", "Neutral"]} value={tone} onChange={setTone} size="sm" />
          </Field>
          <Field label="Length">
            <Segmented options={["6 slides", "10 slides", "16 slides"]} value={length} onChange={setLength} size="sm" />
          </Field>
          <Field label="Target audience" hint="Who will read or present this output">
            <AdvInput defaultValue="CISO, security leadership, board" />
          </Field>
          <Field label="Must-include sources" hint="Comma separated domains">
            <AdvInput defaultValue="NIST, NCSC" placeholder="nist.gov, ncsc.gov.uk" />
          </Field>
          <Field label="Custom instructions">
            <AdvTextarea rows={4} defaultValue="Prefer probability framing over fixed dates. Cite every quantitative claim." />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, padding: 16, borderTop: "1px solid var(--border-soft)" }}>
          <Btn kind="ghost" size="md" style={{ flex: 1 }}>Reset to defaults</Btn>
          <Btn kind="primary" size="md" style={{ flex: 1 }} onClick={onClose}>Apply</Btn>
        </div>
      </div>
    </>
  );
}

export function Define({ onPropose }: { onPropose: () => void }) {
  const [topic, setTopic] = useState("Research the impact of quantum computing on cryptography and produce a 10-slide PowerPoint for a security leadership audience.");
  const [fmt, setFmt] = useState("pptx");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tone, setTone] = useState("Executive");
  const [length, setLength] = useState("10 slides");
  const [focused, setFocused] = useState(false);
  const [advHover, setAdvHover] = useState(false);
  const valid = topic.trim().length > 12;
  const near = topic.length >= GOAL_MIN && topic.length <= GOAL_MAX;
  const fmtLabel = FORMATS.find((f) => f.id === fmt)?.label || "—";

  /* ⌘↵ / Ctrl+↵ submits from anywhere on the stage */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && valid && !drawerOpen) {
        e.preventDefault();
        onPropose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [valid, drawerOpen, onPropose]);

  /* Roving arrow-key selection inside the format radio group */
  const onFormatKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const idx = FORMATS.findIndex((f) => f.id === fmt);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % FORMATS.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + FORMATS.length) % FORMATS.length;
    if (next >= 0) {
      e.preventDefault();
      setFmt(FORMATS[next].id);
      const radios = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      radios[next]?.focus();
    }
  };

  const counterText = near
    ? `${topic.length} chars · good detail`
    : topic.length < GOAL_MIN
      ? `${topic.length} chars · aim for ${GOAL_MIN}–${GOAL_MAX}`
      : `${topic.length} chars`;

  return (
    <div style={{ overflow: "auto", height: "100%", padding: "40px 24px 132px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="rise" style={{ marginBottom: 28 }}>
          <Badge tone="accent" icon="wand">New project</Badge>
          <h1 className="h1" style={{ marginTop: 14 }}>What should the swarm research?</h1>
          <p className="muted" style={{ fontSize: 15, marginTop: 6, maxWidth: 560 }}>
            Describe the goal in plain language. An orchestrator will propose a team of specialist agents for you to approve.
          </p>
        </div>

        <div className="rise" style={{ marginBottom: 28 }}>
          <label htmlFor="goal" className="h4" style={{ display: "block", marginBottom: 10 }}>Research goal</label>
          <div style={{ position: "relative" }}>
            <textarea
              id="goal"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              rows={4}
              aria-describedby="goal-counter"
              placeholder="e.g. Analyze the competitive landscape for vector databases and write a PDF report…"
              style={{
                width: "100%", resize: "vertical", minHeight: 112, padding: "14px 16px 38px", borderRadius: "var(--r-md)",
                background: focused ? "color-mix(in oklab, var(--surface) 97%, var(--accent) 3%)" : "var(--surface)",
                border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
                color: "var(--text)", fontFamily: "var(--font)", fontSize: 15, lineHeight: 1.55, outline: "none",
                boxShadow: focused
                  ? "0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent), var(--shadow-lg)"
                  : "var(--shadow-sm)",
                transition: "border-color 180ms, box-shadow 220ms, background 180ms",
              }} />
            <div id="goal-counter" aria-live="polite" style={{ position: "absolute", right: 10, bottom: 12, pointerEvents: "none" }}>
              <span className="mono" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: near ? 600 : 500,
                color: near ? "var(--st-done)" : "var(--muted)",
                background: "color-mix(in srgb, var(--surface) 86%, transparent)",
                border: `1px solid ${near ? "color-mix(in srgb, var(--st-done) 35%, transparent)" : "var(--border-soft)"}`,
                borderRadius: "var(--r-pill)", padding: "3px 9px",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                transition: "color 160ms, border-color 160ms",
              }}>
                {near && <Icon name="check" size={10} color="var(--st-done)" />}
                {counterText}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Quick start:</span>
            {SUGGESTIONS.map((s) => (
              <button key={s.label} onClick={() => setTopic(s.label)} aria-label={`Use suggestion: ${s.label}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px 6px 10px",
                  borderRadius: "var(--r-pill)", background: "var(--elevated)", border: "1px solid var(--border)",
                  color: "var(--text-2)", cursor: "pointer", fontFamily: "var(--font)",
                  transition: "border-color 140ms, transform 140ms, background 140ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}>
                <Icon name={s.icon} size={12} color="var(--muted)" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rise" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <label className="h4" id="format-label">Output format</label>
            <span aria-live="polite" style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
              color: "var(--accent-2)",
            }}>
              <Icon name="check-circle-fill" size={12} color="var(--accent)" />
              {fmtLabel}
            </span>
          </div>
          <div role="radiogroup" aria-labelledby="format-label" onKeyDown={onFormatKey}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {FORMATS.map((f) => <FormatCard key={f.id} fmt={f} selected={fmt === f.id} onClick={() => setFmt(f.id)} />)}
          </div>
        </div>

        <div className="rise" style={{ marginBottom: 28 }}>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            onMouseEnter={() => setAdvHover(true)}
            onMouseLeave={() => setAdvHover(false)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: advHover ? "var(--elevated)" : "var(--surface)",
              border: `1px solid ${advHover ? "var(--border-strong)" : "var(--border)"}`,
              borderRadius: "var(--r-md)", cursor: "pointer", color: "var(--text-2)", fontFamily: "var(--font)",
              fontSize: 13.5, fontWeight: 600, padding: "12px 16px", width: "100%", textAlign: "left",
              boxShadow: advHover ? "var(--shadow-md)" : "var(--shadow-sm)",
              transition: "background 140ms, border-color 140ms, box-shadow 160ms",
            }}>
            <span style={{
              width: 32, height: 32, borderRadius: "var(--r-sm)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--muted)",
            }}>
              <Icon name="sliders" size={15} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              Advanced settings
              <span style={{ fontWeight: 400, fontSize: 12, color: "var(--muted)" }}>Audience, sources & custom instructions</span>
            </span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {[tone, length].map((v) => (
                <span key={v} style={{
                  fontSize: 11.5, fontWeight: 500, color: "var(--text-2)", padding: "3px 9px",
                  borderRadius: "var(--r-pill)", background: "var(--elevated)", border: "1px solid var(--border)",
                }}>{v}</span>
              ))}
              <Icon name="chevron-right" size={15} style={{ color: "var(--muted)" }} />
            </span>
          </button>
        </div>
      </div>

      <div style={{
        position: "sticky", bottom: 0, left: 0, right: 0, marginTop: 8, paddingTop: 28,
        background: "linear-gradient(180deg, transparent 0%, var(--bg) 62%)",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="glass-strong" style={{
            borderRadius: "var(--r-lg)", padding: "12px 12px 12px 18px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "var(--shadow-lg), 0 1px 0 var(--glass-hi) inset",
          }}>
            <div role="status" aria-live="polite" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {valid
                  ? <><Icon name="check-circle-fill" size={15} color="var(--st-done)" /><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Ready to propose your team</span></>
                  : <><Icon name="alert-circle" size={15} color="var(--st-blocked)" /><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Describe your research goal to continue</span></>}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 23, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {valid ? `${fmtLabel} · ${tone} · ${length}` : `A sentence or two works — ${GOAL_MIN}–${GOAL_MAX} characters is ideal`}
              </span>
            </div>
            {valid && (
              <span aria-hidden="true" style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {["⌘", "↵"].map((k) => (
                  <kbd key={k} style={{
                    fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--muted)",
                    background: "var(--elevated)", border: "1px solid var(--border)", borderBottomWidth: 2,
                    borderRadius: "var(--r-xs)", padding: "2px 6px", minWidth: 20, textAlign: "center",
                  }}>{k}</kbd>
                ))}
              </span>
            )}
            <Btn kind="primary" size="lg" icon="wand" disabled={!valid} onClick={onPropose}>Propose agent team</Btn>
          </div>
        </div>
      </div>

      <AdvancedDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} tone={tone} setTone={setTone} length={length} setLength={setLength} />
    </div>
  );
}
