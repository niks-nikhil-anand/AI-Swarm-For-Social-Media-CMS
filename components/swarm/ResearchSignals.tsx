"use client";

interface ResearchSignalsProps {
  theme: string;
}

export function ResearchSignals({ theme }: ResearchSignalsProps) {
  const v = (n: string) => `var(--${n})`;
  
  const IN = { p: 'in', pBg: '#0a66c2', pFg: '#fff' };
  const X = { p: 'X', pBg: theme === 'light' ? '#17202f' : '#e8edf6', pFg: theme === 'light' ? '#fff' : '#0a0e16' };
  const plat = (k: string) => k === 'in' ? IN : X;

  const stats = [
    { label: 'Signals today', val: '27', sub: '+9 vs yesterday', c: v('grn') },
    { label: 'Sources scanned', val: '142', sub: 'SearXNG', c: v('faint') },
    { label: 'Rising topics', val: '9', sub: 'above 7.0', c: v('acc') },
    { label: 'Drafts created', val: '3', sub: 'from signals', c: v('faint') },
  ];

  const signals = [
    { topic: 'AI agents for social media teams', score: '9.2', sC: v('grn'), dir: '▲ rising', dC: v('grn'), src: 12, rel: 'High', found: '42m ago', ...plat('in') },
    { topic: 'Using social listening to find customer pain points', score: '8.4', sC: v('grn'), dir: '▲ rising', dC: v('grn'), src: 8, rel: 'High', found: '42m ago', ...plat('X') },
    { topic: 'How founders can automate content research', score: '7.8', sC: v('amb'), dir: '→ steady', dC: v('mut'), src: 6, rel: 'Medium', found: '1h ago', ...plat('X') },
    { topic: 'LinkedIn content systems for B2B startups', score: '7.5', sC: v('amb'), dir: '▲ rising', dC: v('grn'), src: 5, rel: 'High', found: '1h ago', ...plat('in') },
    { topic: 'Why approval gates matter in AI publishing', score: '6.9', sC: v('mut'), dir: '▼ cooling', dC: v('red'), src: 4, rel: 'Medium', found: '2h ago', ...plat('in') },
    { topic: 'Temporal workflows for content pipelines', score: '6.6', sC: v('mut'), dir: '▲ rising', dC: v('grn'), src: 5, rel: 'Medium', found: '2h ago', ...plat('X') },
    { topic: 'Building in public: weekly metrics posts', score: '6.2', sC: v('mut'), dir: '→ steady', dC: v('mut'), src: 3, rel: 'Medium', found: '3h ago', ...plat('in') },
    { topic: 'Open-source alternatives to Buffer & Hootsuite', score: '5.9', sC: v('mut'), dir: '▲ rising', dC: v('grn'), src: 7, rel: 'Low', found: '4h ago', ...plat('X') },
    { topic: 'AI content and the LinkedIn algorithm in 2026', score: '5.4', sC: v('mut'), dir: '▼ cooling', dC: v('red'), src: 4, rel: 'Low', found: '5h ago', ...plat('in') },
  ];

  const sources = [
    { name: 'Hacker News', n: 34, pct: 100 },
    { name: 'X / Twitter', n: 28, pct: 82 },
    { name: 'Reddit', n: 24, pct: 71 },
    { name: 'LinkedIn', n: 21, pct: 62 },
    { name: 'RSS / blogs', n: 19, pct: 56 },
    { name: 'Product Hunt', n: 16, pct: 47 },
  ];

  const keywords = ['ai agents', 'content automation', 'social listening', 'b2b linkedin', 'founder brand', 'approval workflow', 'temporal', 'postiz'];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", alignItems: "flex-start", maxWidth: "1240px" }}>
      <div style={{ flex: "1 1 620px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "10px" }}>
          {stats.map((k, i) => (
            <div key={i} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", padding: "12px 14px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: "11px", color: "var(--mut)" }}>{k.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                <span style={{ fontSize: "21px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{k.val}</span>
                <span style={{ fontSize: "11px", color: k.c }}>{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Signals List */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)", overflowX: "auto" }}>
          <div style={{ minWidth: "860px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: "13.5px", fontWeight: 600 }}>All Signals</span>
              <span style={{ fontSize: "11px", color: "var(--faint)" }}>last scan 42m ago · next in 18m</span>
              <div style={{ flex: 1 }}></div>
              <button style={{ font: "inherit", fontSize: "11.5px", fontWeight: 600, padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: "var(--acc)", cursor: "pointer", whiteSpace: "nowrap" }}>Run scan now</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(230px,2fr) 64px 76px 60px 76px 56px 78px 96px", gap: "12px", padding: "8px 16px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", borderBottom: "1px solid var(--line)" }}>
              <span>Topic</span><span>Score</span><span>Trend</span><span>Sources</span><span>Relevance</span><span>Platform</span><span>Found</span><span></span>
            </div>
            {signals.map((g, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(230px,2fr) 64px 76px 60px 76px 56px 78px 96px", gap: "12px", alignItems: "center", padding: "9px 16px", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 500, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.topic}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "12px", fontWeight: 600, color: g.sC }}>{g.score}</span>
                <span style={{ fontSize: "11.5px", color: g.dC, whiteSpace: "nowrap" }}>{g.dir}</span>
                <span style={{ fontSize: "11.5px", color: "var(--mut)", fontFamily: "'IBM Plex Mono',monospace" }}>{g.src}</span>
                <span style={{ fontSize: "11px", color: "var(--mut)" }}>{g.rel}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, width: "18px", height: "18px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: g.pBg, color: g.pFg }}>{g.p}</span>
                <span style={{ fontSize: "11px", color: "var(--faint)", fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "nowrap" }}>{g.found}</span>
                <button style={{ font: "inherit", fontSize: "11px", fontWeight: 600, padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: "var(--acc)", cursor: "pointer", justifySelf: "end", whiteSpace: "nowrap" }}>Create draft</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside style={{ flex: "1 1 250px", maxWidth: "312px", minWidth: "240px", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Top Sources */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontSize: "13.5px", fontWeight: 600 }}>Top Sources</div>
          <div style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
            {sources.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 16px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--acc)", opacity: 0.7, flex: "none" }}></span>
                <span style={{ flex: 1, fontSize: "12px" }}>{s.name}</span>
                <div style={{ width: "70px", height: "5px", borderRadius: "3px", background: "var(--chip)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "3px", background: "var(--acc)", width: `${s.pct}%` }}></div>
                </div>
                <span style={{ fontSize: "11px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--mut)", width: "24px", textAlign: "right" }}>{s.n}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Listening Keywords */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Listening Keywords</span>
            <div style={{ flex: 1 }}></div>
            <a href="#" style={{ fontSize: "11.5px" }}>Edit</a>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", padding: "13px 16px" }}>
            {keywords.map((k, i) => (
              <span key={i} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "11px", background: "var(--chip)", color: "var(--mut)", border: "1px solid var(--line)" }}>{k}</span>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
