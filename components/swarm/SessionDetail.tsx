"use client";
/* ============================================================
   SWARM — Session detail (open a project, see its output)
   ============================================================ */
import { useState } from "react";
import { Icon, Btn, IconBtn, Badge, Card, Ring, StatusDot } from "./ui";
import { Slide } from "./Output";
import { SLIDES, SOURCES, HISTORY, type Project } from "./data";

function money(n: number) { return "$" + n.toFixed(2); }
const SS: Record<string, [string, string]> = { running: ["running", "Running"], complete: ["done", "Complete"], failed: ["error", "Failed"] };

/* ---- document-style output preview (PDF / DOCX / blog / md) ---- */
function DocPreview({ s }: { s: Project }) {
  const sections: { h: string; p?: string; bullets?: string[] }[] = [
    { h: "Executive summary", p: s.summary },
    { h: "Key findings", bullets: [
      "The market is consolidating around a small number of credible options, with switching costs rising sharply.",
      "Cost and operational maturity — not raw capability — are now the deciding factors for most teams.",
      "A pragmatic adoption path favors incremental migration over a single cut-over.",
    ] },
    { h: "Analysis", p: "Findings were cross-checked against at least two independent sources before inclusion. Quantitative claims carry citations; contested figures were softened to ranges during a supervisor re-plan. The full evidence trail is preserved in the shared workspace." },
    { h: "Outlook", p: "Over the next 12–18 months, expect continued convergence and clearer pricing. Teams that build for portability now will retain the most leverage." },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "28px 24px" }}>
      <div style={{ width: "100%", maxWidth: 720, background: "linear-gradient(160deg, #101015, #0b0b0e)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-md)", padding: "44px 52px", color: "#ececed" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-2)", fontWeight: 600 }}>{s.fmt}</div>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.6px", margin: "10px 0 8px", lineHeight: 1.15 }}>{s.title}</h1>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "rgba(236,236,237,0.5)", fontFamily: "var(--mono)", marginBottom: 28, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span>{s.words.toLocaleString()} words</span><span>·</span><span>{s.sourcesN} sources</span><span>·</span><span>{s.date}</span>
        </div>
        {sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{sec.h}</h2>
            {sec.p && <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(236,236,237,0.78)" }}>{sec.p}</p>}
            {sec.bullets && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {sec.bullets.map((b, j) => (
                  <li key={j} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.55, color: "rgba(236,236,237,0.78)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", marginTop: 7, flexShrink: 0 }} />{b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PptxPreview() {
  const [idx, setIdx] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px", gap: 16 }}>
      <div style={{ width: "100%", maxWidth: 680 }}><Slide s={SLIDES[idx]} scale={0.68} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <IconBtn name="chevron-left" title="Previous" onClick={() => setIdx((i) => Math.max(0, i - 1))} />
        <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)", minWidth: 60, textAlign: "center" }}>{String(idx + 1).padStart(2, "0")} / {SLIDES.length}</span>
        <IconBtn name="chevron-right" title="Next" onClick={() => setIdx((i) => Math.min(SLIDES.length - 1, i + 1))} />
      </div>
    </div>
  );
}

function MetaRow({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5, padding: "7px 0" }}><span className="muted" style={{ whiteSpace: "nowrap" }}>{k}</span><span className={mono ? "mono" : ""} style={{ color: "var(--text)", textAlign: "right", whiteSpace: "nowrap" }}>{v}</span></div>;
}

export function SessionDetail({ id, onBack, onOpenLive, onRerun }: {
  id: string | null; onBack: () => void; onOpenLive: () => void; onRerun: () => void;
}) {
  const s = HISTORY.find((x) => x.id === id) || HISTORY[0];
  const [dot, lab] = SS[s.status];
  const running = s.status === "running";
  const failed = s.status === "failed";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <Btn kind="ghost" size="sm" icon="arrow-left" onClick={onBack}>Projects</Btn>
        <div style={{ width: 1, height: 22, background: "var(--border)" }} />
        <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", color: s.accent }}><Icon name={s.fmtIcon} size={15} /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 420 }}>{s.title}</div>
          <div className="faint" style={{ fontSize: 11.5 }}>{s.fmt} · {s.date}</div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: `var(--st-${dot === "working" ? "working" : dot})`, marginLeft: 4 }}><StatusDot status={dot} size={7} />{lab}</span>
        <div style={{ flex: 1 }} />
        {running
          ? <Btn kind="primary" icon="activity" onClick={onOpenLive}>Open live run</Btn>
          : <>
              <IconBtn name="duplicate" title="Clone & re-run" onClick={onRerun} />
              <IconBtn name="trash" title="Delete" />
              {!failed && <Btn kind="primary" icon="download">Download</Btn>}
            </>}
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", background: "var(--bg-2)" }}>
          {running ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <Card style={{ maxWidth: 460, textAlign: "center", padding: 30 }}>
                <Ring value={20} size={72} stroke={5}><Icon name="activity" size={24} color="var(--accent)" /></Ring>
                <h3 className="h3" style={{ marginTop: 14 }}>Swarm is still running</h3>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>7 agents are researching live. The {s.fmt} will appear here when the Synthesis Agent finishes.</p>
                <div style={{ marginTop: 20 }}><Btn kind="primary" icon="activity" onClick={onOpenLive}>Open live run</Btn></div>
              </Card>
            </div>
          ) : failed ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <Card style={{ maxWidth: 440, textAlign: "center", padding: 30 }}>
                <div style={{ width: 52, height: 52, borderRadius: "var(--r-lg)", background: "var(--st-error-soft)", color: "var(--st-error)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Icon name="alert-circle" size={24} /></div>
                <h3 className="h3">Synthesis failed</h3>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>{s.summary}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
                  <Btn kind="secondary" icon="folder">Open workspace</Btn>
                  <Btn kind="primary" icon="reload" onClick={onRerun}>Retry</Btn>
                </div>
              </Card>
            </div>
          ) : s.kind === "pptx" ? <PptxPreview /> : <DocPreview s={s} />}
        </div>

        <div style={{ width: 320, flexShrink: 0, borderLeft: "1px solid var(--border)", overflow: "auto", background: "var(--surface)" }}>
          <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Goal</div>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{s.goal}</p>
          </div>

          <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--border)" }}>
            <div className="eyebrow" style={{ margin: "8px 0 4px" }}>Overview</div>
            <MetaRow k="Format" v={s.fmt} />
            <MetaRow k="Agents" v={s.agents} mono />
            <MetaRow k="Run time" v={s.duration} mono />
            <MetaRow k="Words" v={s.words ? s.words.toLocaleString() : "—"} mono />
            <MetaRow k="Sources" v={s.sourcesN} mono />
          </div>

          <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "8px 0 10px" }}>
              <span className="eyebrow" style={{ whiteSpace: "nowrap" }}>API cost</span>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{money(s.cost)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {([["Input tokens", (s.tokIn / 1e6).toFixed(2) + "M", "var(--blue)"], ["Output tokens", (s.tokOut / 1e6).toFixed(2) + "M", "var(--purple)"], ["Web searches", String(s.searches), "var(--cyan)"]] as [string, string, string][]).map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: c, flexShrink: 0 }} />
                  <span className="muted" style={{ whiteSpace: "nowrap" }}>{k}</span>
                  <span className="mono" style={{ marginLeft: "auto", color: "var(--text-2)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="eyebrow">Sources</span><Badge tone="neutral">{s.sourcesN}</Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SOURCES.slice(0, s.kind === "pptx" ? 7 : 5).map((src, i) => (
                <a key={i} href="#" onClick={(e) => e.preventDefault()} style={{ display: "flex", gap: 9, padding: 9, borderRadius: "var(--r-sm)", background: "var(--elevated)", border: "1px solid var(--border)" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-2)", color: "var(--st-working)" }}><Icon name="globe" size={11} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--accent-2)" }}>{src.host}</span>
                    <div style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{src.title}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
