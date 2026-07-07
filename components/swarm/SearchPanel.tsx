"use client";
/* ============================================================
   SWARM — SearchPanel: live SearXNG search inside the Run stage
   ============================================================ */
import { useState, useEffect, type FormEvent } from "react";
import { Icon, Btn, Badge } from "./ui";
import type { SearchResult } from "./data";

export function SearchPanel({ projectId, agentId, onResults }: {
  projectId?: string;
  agentId?: string;
  onResults?: (results: SearchResult[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  // Seed with results persisted from earlier searches so a refresh
  // doesn't lose the evidence trail.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/search/results?projectId=${encodeURIComponent(projectId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.results?.length) setResults(data.results);
      })
      .catch(() => { /* offline — panel starts empty */ });
    return () => { cancelled = true; };
  }, [projectId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, query: q, agentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results);
      onResults?.(data.results);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ borderBottom: "1px solid var(--border-soft)" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, padding: "10px 14px" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 12px", borderRadius: "var(--r-sm)", background: "var(--elevated)", border: "1px solid var(--border)" }}>
          <Icon name="search" size={14} color="var(--muted)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the web via SearXNG…"
            disabled={loading}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13.5, color: "var(--text)", fontFamily: "var(--font)" }}
          />
        </div>
        <Btn kind="primary" type="submit" icon="search" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </Btn>
      </form>

      {error && (
        <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--st-error)" }}>
          <Icon name="alert-circle" size={13} />
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ padding: "0 14px 12px" }}>
          <button
            onClick={() => setOpen(!open)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", padding: "0 0 8px", fontFamily: "var(--font)" }}
          >
            <Badge tone="accent" icon="search">{results.length} results</Badge>
            <Icon name={open ? "chevron-up" : "chevron-down"} size={13} color="var(--muted)" />
          </button>

          {open && (
            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {results.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rise"
                  style={{ display: "block", padding: "9px 12px", borderRadius: "var(--r-sm)", background: "var(--elevated)", border: "1px solid var(--border)", textDecoration: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{r.title}</span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--faint)", flexShrink: 0 }}>#{r.rank}</span>
                    <Icon name="external-link" size={11} color="var(--faint)" />
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: r.snippet ? 4 : 0 }}>{r.url}</div>
                  {r.snippet && (
                    <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.snippet}</div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
