"use client";
/* ============================================================
   SWARM — Stage 4: Output viewer (PPTX deck)
   ============================================================ */
import { useState, useEffect, type CSSProperties } from "react";
import { Icon, Btn, IconBtn, Badge, Card, Ring, SwarmMark, Segmented } from "./ui";
import { type Slide as SlideT, type Source } from "./data";
import { DEMO_SLIDES, DEMO_SOURCES } from "./demoData";

interface FetchedProject {
  title: string;
  format: string;
  status: "Draft" | "Running" | "Complete" | "Failed";
  agents: unknown[];
  searches: number;
  durationSeconds: number | null;
  wordCount: number | null;
  slides: SlideT[];
  searchResults: { id: string; title: string; url: string }[];
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function fmtRunTime(seconds: number | null): string {
  if (!seconds) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// De-dupe search results down to one row per host for the sidebar's cited-sources list.
function sourcesFromSearchResults(results: { id: string; title: string; url: string }[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const r of results) {
    const host = hostOf(r.url);
    if (seen.has(host)) continue;
    seen.add(host);
    out.push({ host, title: r.title, by: "", verified: true });
  }
  return out;
}

/* ---- mini charts (rendered inside slides) ---- */
function ChartDist({ accent = "var(--accent)" }: { accent?: string }) {
  const bars = [2, 5, 11, 20, 24, 18, 11, 6, 3];
  const max = Math.max(...bars);
  return (
    <svg viewBox="0 0 320 150" style={{ width: "100%", height: "auto" }}>
      {bars.map((v, i) => {
        const h = (v / max) * 110; const x = 14 + i * 34;
        const hot = i === 3 || i === 4;
        return <rect key={i} x={x} y={130 - h} width={22} height={h} rx={3} fill={hot ? accent : "color-mix(in oklab, var(--muted) 40%, transparent)"} />;
      })}
      <line x1="8" y1="130" x2="312" y2="130" stroke="var(--border-strong)" strokeWidth="1" />
      {["'28", "'30", "'32", "'34", "'36"].map((t, i) => <text key={i} x={31 + i * 68} y="146" fontSize="9" fill="var(--faint)" textAnchor="middle" fontFamily="var(--mono)">{t}</text>)}
    </svg>
  );
}
function ChartLine({ accent = "var(--accent)" }: { accent?: string }) {
  const cap = [6, 10, 16, 26, 42, 66, 104, 168];
  const req = [200, 195, 188, 180, 170, 158, 144, 128];
  const max = 220;
  const pts = (arr: number[]) => arr.map((v, i) => `${20 + i * 40},${130 - (v / max) * 110}`).join(" ");
  return (
    <svg viewBox="0 0 320 150" style={{ width: "100%", height: "auto" }}>
      <polyline points={pts(req)} fill="none" stroke="var(--st-blocked)" strokeWidth="2.2" strokeDasharray="4 4" />
      <polyline points={pts(cap)} fill="none" stroke={accent} strokeWidth="2.6" />
      {cap.map((v, i) => <circle key={i} cx={20 + i * 40} cy={130 - (v / max) * 110} r="2.6" fill={accent} />)}
      <line x1="14" y1="130" x2="312" y2="130" stroke="var(--border-strong)" strokeWidth="1" />
      <text x="300" y="44" fontSize="9" fill="var(--st-blocked)" textAnchor="end" fontFamily="var(--mono)">requirement</text>
      <text x="180" y="118" fontSize="9" fill={accent} textAnchor="end" fontFamily="var(--mono)">capability</text>
    </svg>
  );
}
function ChartBars({ }: { accent?: string }) {
  const rows: [string, number, string][] = [["Migration time (X)", 62, "var(--st-working)"], ["Shelf-life (Y)", 78, "var(--purple)"], ["Time to quantum (Z)", 54, "var(--st-blocked)"]];
  return (
    <svg viewBox="0 0 320 150" style={{ width: "100%", height: "auto" }}>
      {rows.map(([label, v, c], i) => (
        <g key={i}>
          <text x="6" y={26 + i * 44} fontSize="10" fill="var(--text-2)" fontFamily="var(--font)">{label}</text>
          <rect x="6" y={32 + i * 44} width="308" height="12" rx="6" fill="var(--elevated)" />
          <rect x="6" y={32 + i * 44} width={(v / 100) * 308} height="12" rx="6" fill={c} />
        </g>
      ))}
    </svg>
  );
}

/* ---- a single rendered slide (16:9) ---- */
export function Slide({ s, scale = 1 }: { s: SlideT; scale?: number }) {
  const base: CSSProperties = {
    width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--r-md)", overflow: "hidden", position: "relative",
    background: "linear-gradient(150deg, #101015, #0a0a0c)", color: "#f4f4f6", boxShadow: "var(--shadow-md)",
    border: "1px solid var(--border)", fontFamily: "var(--font)",
  };
  const fs = (px: number) => `${px * scale}px`;
  const pad: CSSProperties = { position: "absolute", inset: 0, padding: `${5 * scale}% ${6 * scale}%`, display: "flex", flexDirection: "column" };
  const accent = "var(--accent)";
  const num = <div style={{ position: "absolute", bottom: fs(14), right: fs(18), fontFamily: "var(--mono)", fontSize: fs(10), color: "rgba(244,244,246,0.4)" }}>{String(s.n).padStart(2, "0")} / 10</div>;
  const grid = <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: `${24 * scale}px ${24 * scale}px` }} />;

  if (s.kind === "title") {
    return (
      <div style={base}>{grid}
        <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "60%", height: "100%", background: "radial-gradient(circle, var(--accent-soft), transparent 65%)" }} />
        <div style={{ ...pad, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: fs(8), marginBottom: fs(20) }}><SwarmMark size={26 * scale} glow={false} /><span style={{ fontSize: fs(14), fontWeight: 700, letterSpacing: "-0.3px" }}>Swarm</span></div>
          <div style={{ fontSize: fs(40), fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.05, maxWidth: "82%" }}>{s.title}</div>
          <div style={{ fontSize: fs(16), color: "rgba(244,244,246,0.6)", marginTop: fs(14) }}>{s.sub}</div>
          <div style={{ position: "absolute", bottom: fs(28), left: `${6 * scale}%`, fontSize: fs(11), color: "rgba(244,244,246,0.4)", fontFamily: "var(--mono)" }}>{s.footer}</div>
        </div>
      </div>
    );
  }
  if (s.kind === "stat") {
    return (
      <div style={base}>{grid}
        <div style={pad}>
          <div style={{ fontSize: fs(13), fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.title}</div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: fs(76), fontWeight: 700, letterSpacing: "-2px", lineHeight: 1, color: "#fff", fontFamily: "var(--font)" }}>{s.stat}</div>
            <div style={{ fontSize: fs(16), color: accent, marginTop: fs(6), fontWeight: 600 }}>{s.statSub}</div>
            <div style={{ fontSize: fs(15), color: "rgba(244,244,246,0.7)", marginTop: fs(18), maxWidth: "70%", lineHeight: 1.5 }}>{s.body}</div>
          </div>
        </div>{num}
      </div>
    );
  }
  if (s.kind === "chart") {
    return (
      <div style={base}>{grid}
        <div style={pad}>
          <div style={{ fontSize: fs(24), fontWeight: 700, letterSpacing: "-0.5px" }}>{s.title}</div>
          <div style={{ fontSize: fs(13.5), color: "rgba(244,244,246,0.65)", marginTop: fs(8), maxWidth: "76%", lineHeight: 1.5 }}>{s.body}</div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginTop: fs(10) }}>
            <div style={{ width: "82%" }}>
              {s.chart === "dist" && <ChartDist accent={accent} />}
              {s.chart === "line" && <ChartLine accent={accent} />}
              {s.chart === "bars" && <ChartBars accent={accent} />}
            </div>
          </div>
        </div>{num}
      </div>
    );
  }
  // bullets / close
  return (
    <div style={base}>{grid}
      <div style={pad}>
        <div style={{ fontSize: fs(26), fontWeight: 700, letterSpacing: "-0.5px", color: s.kind === "close" ? accent : "#fff" }}>{s.title}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: fs(14), marginTop: fs(8) }}>
          {(s.bullets ?? []).map((b, i) => (
            <div key={i} style={{ display: "flex", gap: fs(12), alignItems: "flex-start" }}>
              <span style={{ width: fs(22), height: fs(22), flexShrink: 0, borderRadius: 6, background: "var(--accent-soft)", color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs(11), fontWeight: 700, fontFamily: "var(--mono)", marginTop: fs(1) }}>{i + 1}</span>
              <span style={{ fontSize: fs(16), color: "rgba(244,244,246,0.88)", lineHeight: 1.45 }}>{b}</span>
            </div>
          ))}
        </div>
        {s.footer && <div style={{ fontSize: fs(11), color: "rgba(244,244,246,0.4)", fontFamily: "var(--mono)" }}>{s.footer}</div>}
      </div>{num}
    </div>
  );
}

function GeneratingOverlay() {
  const steps = ["Collecting approved artifacts", "Embedding 14 citations", "Applying layout system", "Rendering deck.pptx"];
  const [step, setStep] = useState(0);
  useEffect(() => { const id = setInterval(() => setStep((s) => Math.min(steps.length - 1, s + 1)), 520); return () => clearInterval(id); }, [steps.length]);
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, zIndex: 30 }}>
      <div style={{ position: "relative" }}>
        <Ring value={(step + 1) / steps.length * 100} size={86} stroke={5}><SwarmMark size={34} /></Ring>
      </div>
      <div style={{ textAlign: "center" }}>
        <div className="h3">Synthesis agent is assembling your deck</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, alignItems: "center" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: i <= step ? "var(--text-2)" : "var(--faint)" }}>
              {i < step ? <Icon name="check-circle-fill" size={14} color="var(--st-done)" /> : i === step ? <span style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: 999, animation: "swarm-spin 0.7s linear infinite" }} /> : <span style={{ width: 14, height: 14, borderRadius: 999, border: "1.5px solid var(--border-strong)" }} />}
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Output({ onRerun, projectId }: { onRerun: () => void; projectId?: string | null }) {
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState<"slides" | "grid">("slides");
  const [project, setProject] = useState<FetchedProject | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("not found");
        const data: FetchedProject = await res.json();
        if (cancelled) return;
        setProject(data);
        if (data.status === "Running") timer = setTimeout(load, 3000);
      } catch {
        if (!cancelled) setNotFound(true);
      }
    }
    load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [projectId]);

  // No projectId → dev/Storybook preview of the UI with demo content.
  const isLive = !!projectId;
  const slides = isLive ? (project?.slides ?? []) : DEMO_SLIDES;
  const sources = isLive ? sourcesFromSearchResults(project?.searchResults ?? []) : DEMO_SOURCES;
  const genState: "generating" | "done" | "failed" | "empty" = !isLive
    ? "done"
    : notFound
    ? "failed"
    : !project
    ? "generating"
    : project.status === "Running"
    ? "generating"
    : project.status === "Failed"
    ? "failed"
    : slides.length === 0
    ? "empty"
    : "done";

  if (genState === "generating") return <div style={{ position: "relative", height: "100%" }}><GeneratingOverlay /></div>;
  if (genState === "failed") return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Card style={{ maxWidth: 420, textAlign: "center", padding: 30 }}>
        <div style={{ width: 52, height: 52, borderRadius: "var(--r-lg)", background: "var(--st-error-soft)", color: "var(--st-error)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Icon name="alert-circle" size={24} /></div>
        <h3 className="h3">Synthesis failed</h3>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>The Synthesis Agent couldn&apos;t render the deck. Findings are preserved in the workspace.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          <Btn kind="secondary" icon="folder">Open workspace</Btn>
          <Btn kind="primary" icon="reload" onClick={onRerun}>Retry synthesis</Btn>
        </div>
      </Card>
    </div>
  );
  if (genState === "empty") return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Card style={{ maxWidth: 420, textAlign: "center", padding: 30 }}>
        <h3 className="h3">No slides were generated</h3>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>The run completed but the Presentation Designer didn&apos;t return a deck.</p>
        <div style={{ marginTop: 20 }}><Btn kind="primary" icon="reload" onClick={onRerun}>Re-run</Btn></div>
      </Card>
    </div>
  );

  const cur = slides[idx];
  const fileName = isLive && project ? `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.pptx` : "quantum-cryptography-impact.pptx";
  const agentsCount = isLive && project ? project.agents.length : 7;
  const runTime = isLive && project ? fmtRunTime(project.durationSeconds) : "3:04";
  const words = isLive && project ? (project.wordCount ?? 0).toLocaleString() : "1,240";

  return (
    <div style={{ height: "100%", display: "flex", minHeight: 0 }}>
      {view === "slides" && (
        <div style={{ width: 168, flexShrink: 0, borderRight: "1px solid var(--border)", overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10, background: "var(--bg-2)" }}>
          {slides.map((s, i) => (
            <button key={s.n} onClick={() => setIdx(i)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, position: "relative", borderRadius: "var(--r-sm)", outline: i === idx ? "2px solid var(--accent)" : "1px solid var(--border)", outlineOffset: i === idx ? 0 : -1 }}>
              <Slide s={s} scale={0.28} />
              <span style={{ position: "absolute", top: 4, left: 5, fontFamily: "var(--mono)", fontSize: 9, color: "rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.4)", padding: "1px 4px", borderRadius: 3 }}>{s.n}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <Badge tone="success" icon="check-circle-fill">Generated</Badge>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{fileName}</span>
          <span className="faint" style={{ fontSize: 12 }}>· {slides.length} slides</span>
          <div style={{ flex: 1 }} />
          <Segmented<"slides" | "grid"> size="sm" options={[{ value: "slides", label: "Viewer", icon: "eye" }, { value: "grid", label: "Grid", icon: "grid" }]} value={view} onChange={setView} />
        </div>

        {view === "slides" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 32px", minHeight: 0, gap: 16 }}>
            <div style={{ width: "100%", maxWidth: 720 }}>{cur && <Slide s={cur} scale={0.72} />}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <IconBtn name="chevron-left" title="Previous" onClick={() => setIdx((i) => Math.max(0, i - 1))} />
              <span className="mono" style={{ fontSize: 13, color: "var(--muted)", minWidth: 64, textAlign: "center" }}>{String(idx + 1).padStart(2, "0")} / {slides.length}</span>
              <IconBtn name="chevron-right" title="Next" onClick={() => setIdx((i) => Math.min(slides.length - 1, i + 1))} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
              {slides.map((s, i) => (
                <button key={s.n} onClick={() => { setIdx(i); setView("slides"); }} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}><Slide s={s} scale={0.42} /></button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ width: 320, flexShrink: 0, borderLeft: "1px solid var(--border)", overflow: "auto", background: "var(--surface)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn kind="primary" icon="download" full>Download .pptx</Btn>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="secondary" icon="reload" onClick={onRerun} style={{ flex: 1 }}>Re-run</Btn>
            <Btn kind="secondary" icon="link" style={{ flex: 1 }}>Share</Btn>
          </div>
          <Btn kind="ghost" icon="file-text" full>Export as different format</Btn>
        </div>

        <div style={{ padding: "0 18px 18px", borderBottom: "1px solid var(--border)" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Generation summary</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {([["Format", "PPTX · 16:9"], ["Slides", String(slides.length)], ["Agents", String(agentsCount)], ["Sources", String(sources.length)], ["Run time", runTime], ["Words", words]] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}><span className="muted" style={{ whiteSpace: "nowrap" }}>{k}</span><span className="mono" style={{ color: "var(--text)", whiteSpace: "nowrap" }}>{v}</span></div>
            ))}
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span className="eyebrow">Cited sources</span>
            <Badge tone="neutral">{sources.length}</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sources.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>No sources recorded.</p>}
            {sources.map((src, i) => (
              <a key={i} href="#" onClick={(e) => e.preventDefault()} style={{ display: "flex", gap: 10, padding: 10, borderRadius: "var(--r-sm)", background: "var(--elevated)", border: "1px solid var(--border)" }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-2)", color: "var(--st-working)" }}><Icon name="globe" size={12} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--accent-2)" }}>{src.host}</span>
                    {src.verified && <Icon name="check-circle-fill" size={11} color="var(--st-done)" />}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.4, marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{src.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
