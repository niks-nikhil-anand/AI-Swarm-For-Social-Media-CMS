"use client";

interface SourcesManagerProps {
  theme: string;
}

export function SourcesManager({ theme }: SourcesManagerProps) {
  void theme;
  const v = (n: string) => `var(--${n})`;
  
  const sourcesData = [
    { name: 'Hacker News', detail: 'news.ycombinator.com · front + Ask HN', type: 'SearXNG', n: 34, q: '8.4', crawl: '12m ago', status: 'Active' },
    { name: 'X / Twitter listening', detail: '@handles + 8 keywords', type: 'Listening', n: 28, q: '7.9', crawl: '4m ago', status: 'Active' },
    { name: 'Reddit', detail: 'r/SaaS, r/marketing, r/Entrepreneur', type: 'SearXNG', n: 24, q: '7.2', crawl: '31m ago', status: 'Active' },
    { name: 'LinkedIn listening', detail: 'followed creators + hashtags', type: 'Listening', n: 21, q: '8.1', crawl: '9m ago', status: 'Active' },
    { name: 'Marketing blogs', detail: '14 RSS feeds', type: 'RSS', n: 19, q: '6.8', crawl: '22m ago', status: 'Active' },
    { name: 'Product Hunt', detail: 'daily leaderboard + discussions', type: 'SearXNG', n: 16, q: '6.1', crawl: '48m ago', status: 'Rate-limited' },
    { name: 'Google News', detail: 'query pack: ai marketing', type: 'SearXNG', n: 12, q: '5.6', crawl: '1h ago', status: 'Active' },
    { name: 'Indie Hackers', detail: 'groups: growth, content', type: 'RSS', n: 0, q: '5.2', crawl: '3d ago', status: 'Paused' },
  ].map(s => {
    const qVal = parseFloat(s.q);
    const qPct = Math.round(qVal * 10);
    const qC = qVal >= 7.5 ? v('grn') : qVal >= 6 ? v('amb') : v('mut');
    const dot = s.status === 'Active' ? v('grn') : s.status === 'Rate-limited' ? v('amb') : v('faint');
    const stC = s.status === 'Active' ? v('grn') : s.status === 'Rate-limited' ? v('amb') : v('faint');
    const act = s.status === 'Paused' ? 'Resume' : 'Pause';
    const actC = s.status === 'Paused' ? v('acc') : v('mut');
    return { ...s, qPct, qC, dot, stC, act, actC };
  });

  const keywords = ['ai agents', 'content automation', 'social listening', 'b2b linkedin', 'founder brand', 'approval workflow', 'temporal', 'postiz'];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1100px" }}>
      
      {/* Table Header and action */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", color: "var(--mut)" }}>Where the swarm listens. Signals feed research scans every hour.</span>
        <div style={{ flex: 1 }}></div>
        <button style={{ font: "inherit", fontSize: "12px", fontWeight: 600, padding: "7px 13px", borderRadius: "7px", border: "none", background: "var(--acc)", color: "#08111f", cursor: "pointer" }}>+ Add source</button>
      </div>

      {/* Sources Grid Table */}
      <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <div style={{ minWidth: "880px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1.5fr) 110px 90px 84px 96px 90px 90px", gap: "12px", padding: "9px 16px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", borderBottom: "1px solid var(--line)" }}>
            <span>Source</span><span>Type</span><span>Signals 14d</span><span>Quality</span><span>Last crawl</span><span>Status</span><span></span>
          </div>
          {sourcesData.map((s, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "minmax(180px,1.5fr) 110px 90px 84px 96px 90px 90px", gap: "12px", alignItems: "center", padding: "11px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: s.dot, flex: "none" }}></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.detail}</div>
                </div>
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "9px", background: "var(--chip)", color: "var(--mut)", justifySelf: "start", whiteSpace: "nowrap" }}>{s.type}</span>
              <span style={{ fontSize: "12px", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{s.n}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "44px", height: "5px", borderRadius: "3px", background: "var(--chip)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "3px", background: s.qC, width: `${s.qPct}%` }}></div>
                </div>
                <span style={{ fontSize: "11px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--mut)" }}>{s.q}</span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--mut)", fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "nowrap" }}>{s.crawl}</span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: s.stC, whiteSpace: "nowrap" }}>● {s.status}</span>
              <div style={{ display: "flex", gap: "6px", justifySelf: "end" }}>
                <button style={{ font: "inherit", fontSize: "11px", fontWeight: 600, padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: s.actC, cursor: "pointer", whiteSpace: "nowrap" }}>{s.act}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Crawl and keywords panels */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        
        {/* Keywords */}
        <section style={{ flex: "1 1 320px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
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

        {/* Crawl Schedules list */}
        <section style={{ flex: "1 1 320px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontSize: "13.5px", fontWeight: 600 }}>Crawl schedule</div>
          <div style={{ padding: "13px 16px", display: "flex", flexDirection: "column", gap: "9px", fontSize: "12px", color: "var(--mut)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Research scan</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>every 60 min</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Social listening</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>every 15 min</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>RSS refresh</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>every 30 min</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Next full scan</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--acc)" }}>in 18 min</span></div>
          </div>
        </section>
      </div>

    </div>
  );
}
