"use client";
/* ============================================================
   SWARM — Document output viewer (pdf/docx/blog/md/exec formats)
   Renders the Synthesis Agent's real sections as either a styled
   "Live" preview or the plain Markdown "Raw" source.
   ============================================================ */
import { useState, type ReactNode } from "react";
import { Btn, Icon, Segmented } from "./ui";
import { type DocSection, type DocReference } from "./data";

const CITATION_RE = /\[([\w-]+)\]/g;

// A citation marker can be a "[ref-id]" that maps to references[].refId, or —
// when a model skips that contract — a raw URL. Resolve either shape.
function refIndex(citation: string, references: DocReference[]): number {
  return references.findIndex((r) => r.refId === citation || r.url === citation);
}

// Turn inline [ref-id] markers into numbered superscript citation links.
function renderBodyWithCitations(body: string, references: DocReference[]): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  CITATION_RE.lastIndex = 0;
  let key = 0;
  while ((match = CITATION_RE.exec(body))) {
    const [full, refId] = match;
    const idx = refIndex(refId, references);
    if (idx === -1) continue; // not a resolvable citation — leave the bracketed text as-is
    parts.push(body.slice(last, match.index));
    parts.push(
      <sup key={key++} style={{ color: "var(--accent-2)", fontWeight: 600, marginLeft: 1 }}>
        [{idx + 1}]
      </sup>
    );
    last = match.index + full.length;
  }
  parts.push(body.slice(last));
  return parts;
}

// Section-level citations (ref-ids or raw URLs) resolved against the global
// reference list, deduped and in reference order — used when a model
// attaches citations to a section instead of inlining [ref-id] markers.
function sectionSourceIndices(citations: string[], references: DocReference[]): number[] {
  const idxs = new Set<number>();
  for (const c of citations) {
    const idx = refIndex(c, references);
    if (idx !== -1) idxs.add(idx);
  }
  return Array.from(idxs).sort((a, b) => a - b);
}

function sectionsToMarkdown(title: string, sections: DocSection[], references: DocReference[]): string {
  const lines = [`# ${title}`, ""];
  for (const s of sections) {
    lines.push(`## ${s.heading}`, "", s.body, "");
    if (s.keyTakeaway) lines.push(`> **Key takeaway:** ${s.keyTakeaway}`, "");
    const sourceIdxs = sectionSourceIndices(s.citations, references);
    if (sourceIdxs.length) lines.push(`*Sources: ${sourceIdxs.map((i) => `[${i + 1}]`).join(" ")}*`, "");
  }
  if (references.length) {
    lines.push("## References", "");
    references.forEach((r, i) => lines.push(`${i + 1}. [${r.title}](${r.url})`));
  }
  return lines.join("\n");
}

function LiveView({ title, sections, references }: { title: string; sections: DocSection[]; references: DocReference[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "28px 24px" }}>
      <div style={{ width: "100%", maxWidth: 720, background: "linear-gradient(160deg, #101015, #0b0b0e)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-md)", padding: "44px 52px", color: "#ececed" }}>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.6px", margin: "0 0 28px", lineHeight: 1.15, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{title}</h1>
        {sections.map((sec) => {
          const sourceIdxs = sectionSourceIndices(sec.citations, references);
          return (
            <div key={sec.n} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{sec.heading}</h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(236,236,237,0.78)", whiteSpace: "pre-wrap" }}>{renderBodyWithCitations(sec.body, references)}</p>
              {sec.keyTakeaway && (
                <div style={{ display: "flex", gap: 10, marginTop: 12, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--accent-soft)", borderLeft: "3px solid var(--accent)" }}>
                  <span style={{ fontSize: 13, color: "var(--accent-2)", lineHeight: 1.5 }}>{sec.keyTakeaway}</span>
                </div>
              )}
              {sourceIdxs.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: "rgba(236,236,237,0.4)" }}>Sources:</span>
                  {sourceIdxs.map((i) => (
                    <a key={i} href={references[i].url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--accent-2)" }}>[{i + 1}]</a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {references.length > 0 && (
          <div style={{ marginTop: 32, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "rgba(236,236,237,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>References</h2>
            <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              {references.map((r) => (
                <li key={r.refId} style={{ fontSize: 12.5, color: "rgba(236,236,237,0.65)" }}>
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-2)" }}>{r.title}</a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function RawView({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn
          kind="secondary" size="sm" icon={copied ? "check" : "duplicate"}
          onClick={async () => {
            try { await navigator.clipboard.writeText(markdown); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ }
          }}
        >
          {copied ? "Copied" : "Copy Markdown"}
        </Btn>
      </div>
      <pre className="mono" style={{ flex: 1, minHeight: 0, overflow: "auto", margin: 0, padding: 20, borderRadius: "var(--r-md)", background: "var(--bg-2)", border: "1px solid var(--border)", fontSize: 12.5, lineHeight: 1.6, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>
        {markdown}
      </pre>
    </div>
  );
}

export function DocumentViewer({ title, sections, references }: { title: string; sections: DocSection[]; references: DocReference[] }) {
  const [mode, setMode] = useState<"live" | "raw">("live");

  if (sections.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <Icon name="file-text" size={24} color="var(--faint)" />
          <h3 className="h3" style={{ marginTop: 12 }}>No content generated</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>The Synthesis Agent didn&apos;t return any sections for this run.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <Segmented<"live" | "raw"> size="sm" options={[{ value: "live", label: "Live", icon: "eye" }, { value: "raw", label: "Raw", icon: "file-source" }]} value={mode} onChange={setMode} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {mode === "live" ? <LiveView title={title} sections={sections} references={references} /> : <RawView markdown={sectionsToMarkdown(title, sections, references)} />}
      </div>
    </div>
  );
}
