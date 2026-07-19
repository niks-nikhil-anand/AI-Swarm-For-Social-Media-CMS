"use client";

interface DashboardOverviewProps {
  theme: string;
  isPaused: boolean;
  onGoPage: (page: string) => void;
}

export function DashboardOverview({ theme, isPaused: _isPaused, onGoPage }: DashboardOverviewProps) {
  void _isPaused;
  const v = (n: string) => `var(--${n})`;
  
  const IN = { p: 'in', pBg: '#0a66c2', pFg: '#fff' };
  const X = { p: 'X', pBg: theme === 'light' ? '#17202f' : '#e8edf6', pFg: theme === 'light' ? '#fff' : '#0a0e16' };
  const plat = (k: string) => (k === 'in' ? { p: 'in', pBg: IN.pBg, pFg: IN.pFg } : { p: 'X', pBg: X.pBg, pFg: X.pFg });

  const kpis = [
    { label: "Today's target", val: '3', sub: 'posts', c: v('faint') },
    { label: 'Approved', val: '1', sub: 'ready', c: v('grn') },
    { label: 'Needs approval', val: '2', sub: 'waiting', c: v('amb') },
    { label: 'Published today', val: '0', sub: 'of 3', c: v('faint') },
    { label: 'Active workflows', val: '4', sub: 'running', c: v('acc') },
  ];

  const slots = [
    { slot: 'Morning', time: '9:15 AM', title: 'AI agents for social media teams', status: 'Scheduled', stBg: v('grnbg'), stFg: v('grn'), platforms: [plat('in'), plat('X')], note: 'via Postiz', cta: 'Reschedule', ctaBg: v('chip'), ctaFg: v('text') },
    { slot: 'Afternoon', time: '1:30 PM', title: 'Why approval gates matter in AI publishing', status: 'Needs approval', stBg: v('ambbg'), stFg: v('amb'), platforms: [plat('in')], note: 'quality 8.7', cta: 'Review & approve', ctaBg: v('amb'), ctaFg: '#2b1d02', targetPage: 'approvals' },
    { slot: 'Evening', time: '6:45 PM', title: 'How founders can automate content research', status: 'Drafting', stBg: v('accbg'), stFg: v('acc'), platforms: [plat('X')], note: 'writing · 81%', cta: 'Watch run', ctaBg: v('chip'), ctaFg: v('text') },
  ];

  const approvals = [
    { ...IN, hook: '"Your content team isn\'t slow — your approval loop is." Why approval gates matter in AI publishing', topic: 'AI publishing workflows', q: '8.7', qC: v('grn'), fact: 'Fact-check passed', fC: v('grn'), src: 6, when: 'today 1:30 PM' },
    { ...X, hook: 'LinkedIn content systems for B2B startups — a 5-step playbook thread', topic: 'B2B content systems', q: '7.9', qC: v('amb'), fact: '1 claim flagged', fC: v('amb'), src: 4, when: 'tomorrow 9:15 AM' },
  ];

  const runs = [
    { name: 'research-daily-scan', agent: 'agent: searxng-crawler', stage: 'Research', pct: 62, dur: '14m 12s' },
    { name: 'score-trend-topics', agent: 'agent: relevance-scorer', stage: 'Scoring', pct: 38, dur: '6m 40s' },
    { name: 'write-post-b2b-li', agent: 'agent: copywriter-v2', stage: 'Writing', pct: 81, dur: '22m 05s' },
    { name: 'analytics-rollup', agent: 'agent: metrics-collector', stage: 'Analytics', pct: 12, dur: '2m 18s' },
  ];

  const signals = [
    { topic: 'AI agents for social media teams', score: '9.2', sC: v('grn'), dir: '▲ rising', dC: v('grn'), src: 12, rel: 'High', ...plat('in') },
    { topic: 'Using social listening to find customer pain points', score: '8.4', sC: v('grn'), dir: '▲ rising', dC: v('grn'), src: 8, rel: 'High', ...plat('X') },
    { topic: 'How founders can automate content research', score: '7.8', sC: v('amb'), dir: '→ steady', dC: v('mut'), src: 6, rel: 'Medium', ...plat('X') },
    { topic: 'LinkedIn content systems for B2B startups', score: '7.5', sC: v('amb'), dir: '▲ rising', dC: v('grn'), src: 5, rel: 'High', ...plat('in') },
    { topic: 'Why approval gates matter in AI publishing', score: '6.9', sC: v('mut'), dir: '▼ cooling', dC: v('red'), src: 4, rel: 'Medium', ...plat('in') },
  ];

  const days = [
    { d: 'Mon', n: '13', chips: [
      { bg: v('grnbg'), bd: 'transparent', fg: v('grn'), p: 'in', t: '9:15a', mark: '✓' },
      { bg: v('grnbg'), bd: 'transparent', fg: v('grn'), p: 'X', t: '6:45p', mark: '✓' }
    ] },
    { d: 'Tue', n: '14', chips: [
      { bg: v('grnbg'), bd: 'transparent', fg: v('grn'), p: 'in', t: '9:15a', mark: '✓' },
      { bg: v('grnbg'), bd: 'transparent', fg: v('grn'), p: 'in', t: '1:30p', mark: '✓' }
    ] },
    { d: 'Wed', n: '15', chips: [
      { bg: v('grnbg'), bd: 'transparent', fg: v('grn'), p: 'X', t: '9:15a', mark: '✓' }
    ], empty: true },
    { d: 'Thu', n: '16', chips: [
      { bg: v('grnbg'), bd: 'transparent', fg: v('grn'), p: 'in', t: '1:30p', mark: '✓' },
      { bg: v('redbg'), bd: v('red'), fg: v('red'), p: 'X', t: '6:45p', mark: '!' }
    ] },
    { d: 'Fri', n: '17', chips: [
      { bg: v('grnbg'), bd: 'transparent', fg: v('grn'), p: 'in', t: '9:15a', mark: '✓' },
      { bg: v('grnbg'), bd: 'transparent', fg: v('grn'), p: 'X', t: '6:45p', mark: '✓' }
    ] },
    { d: 'Sat', n: '18', chips: [
      { bg: v('accbg'), bd: 'transparent', fg: v('acc'), p: 'in', t: '9:15a', mark: '' },
      { bg: v('accbg'), bd: 'transparent', fg: v('acc'), p: 'in', t: '1:30p', mark: '' },
      { bg: v('accbg'), bd: 'transparent', fg: v('acc'), p: 'X', t: '6:45p', mark: '' }
    ], today: true },
    { d: 'Sun', n: '19', chips: [], empty: true }
  ].map(d => ({ ...d, bg: d.today ? v('card2') : 'transparent', hC: d.today ? v('acc') : v('mut') }));

  const perf = [
    { label: 'Impressions', val: '48.2K', delta: '+12% wow', c: v('grn') },
    { label: 'Engagement', val: '4.6%', delta: '+0.4 pts', c: v('grn') },
    { label: 'Likes', val: '1,284', delta: '+9%', c: v('grn') },
    { label: 'Comments', val: '216', delta: '+21%', c: v('grn') },
    { label: 'Reposts', val: '341', delta: '−3%', c: v('red') },
    { label: 'Link clicks', val: '892', delta: '+15%', c: v('grn') },
    { label: 'Followers', val: '+182', delta: 'this week', c: v('faint') },
  ];

  const services = [
    { name: 'PostgreSQL', status: 'Healthy', c: v('grn'), metric: '4 ms', at: '30s ago' },
    { name: 'SearXNG', status: 'Healthy', c: v('grn'), metric: '210 ms', at: '30s ago' },
    { name: 'Postiz', status: 'Healthy', c: v('grn'), metric: '96 ms', at: '1m ago' },
    { name: 'Temporal', status: 'Healthy', c: v('grn'), metric: '12 ms', at: '30s ago' },
    { name: 'Temporal UI', status: 'Healthy', c: v('grn'), metric: '88 ms', at: '2m ago' },
    { name: 'Worker', status: 'Degraded', c: v('amb'), metric: 'queue 8', at: '15s ago' },
  ];

  const activity = [
    { msg: 'Draft "Why approval gates matter…" sent for approval', t: '4m ago', c: v('amb') },
    { msg: 'write-post-b2b-li reached Writing stage (81%)', t: '9m ago', c: v('acc') },
    { msg: 'Morning post scheduled via Postiz for 9:15 AM', t: '26m ago', c: v('grn') },
    { msg: 'Worker queue depth crossed 8 — degraded threshold', t: '31m ago', c: v('amb') },
    { msg: '27 new signals collected by research-daily-scan', t: '42m ago', c: v('acc') },
    { msg: 'X post failed Thu 6:45 PM — token expired, retried', t: '2h ago', c: v('red') },
    { msg: 'Follower rollup complete: +182 this week', t: '3h ago', c: v('grn') },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", alignItems: "flex-start" }}>
      <main style={{ flex: "1 1 640px", minWidth: 0, display: "flex", flexDirection: "column", gap: "18px" }}>
        
        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "10px" }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", padding: "12px 14px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: "11px", color: "var(--mut)" }}>{k.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                <span style={{ fontSize: "21px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{k.val}</span>
                <span style={{ fontSize: "11px", color: k.c }}>{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Publishing Plan */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Today&apos;s Publishing Plan</span>
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>3 daily slots</span>
            <div style={{ flex: 1 }}></div>
            <span style={{ fontSize: "11px", color: "var(--mut)" }}>1 of 3 ready</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "12px", padding: "14px 16px" }}>
            {slots.map((s, i) => (
              <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "10px", background: "var(--card2)", padding: "13px 14px", display: "flex", flexDirection: "column", gap: "9px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--faint)" }}>{s.slot}</span>
                  <span style={{ fontSize: "11px", color: "var(--mut)", fontFamily: "'IBM Plex Mono',monospace" }}>{s.time}</span>
                  <div style={{ flex: 1 }}></div>
                  <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "9px", background: s.stBg, color: s.stFg }}>{s.status}</span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.35, minHeight: "35px", textWrap: "pretty" }}>{s.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {s.platforms.map((p, idx) => (
                    <span key={idx} style={{ fontSize: "10px", fontWeight: 700, width: "18px", height: "18px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyItems: "center", justifyContent: "center", background: p.pBg, color: p.pFg }}>{p.p}</span>
                  ))}
                  <span style={{ fontSize: "11px", color: "var(--faint)" }}>{s.note}</span>
                </div>
                <div style={{ display: "flex", gap: "7px", marginTop: "2px" }}>
                  <button 
                    onClick={() => s.targetPage && onGoPage(s.targetPage)}
                    style={{ font: "inherit", fontSize: "11.5px", fontWeight: 600, padding: "6px 12px", borderRadius: "6px", border: "none", background: s.ctaBg, color: s.ctaFg, cursor: "pointer" }}
                  >
                    {s.cta}
                  </button>
                  <button style={{ font: "inherit", fontSize: "11.5px", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: "var(--mut)", cursor: "pointer" }}>Preview</button>
                  <button style={{ font: "inherit", fontSize: "11.5px", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: "var(--mut)", cursor: "pointer" }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Approval Queue Widget */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Approval Queue</span>
            <span style={{ fontSize: "10.5px", fontWeight: 600, background: "var(--ambbg)", color: "var(--amb)", borderRadius: "9px", padding: "1px 8px" }}>2 waiting</span>
            <div style={{ flex: 1 }}></div>
            <a href="#" onClick={(e) => { e.preventDefault(); onGoPage('approvals'); }} style={{ fontSize: "11.5px" }}>View all approvals</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {approvals.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: "14px", padding: "14px 16px", borderBottom: "1px solid var(--line)", alignItems: "flex-start" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, width: "20px", height: "20px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: a.pBg, color: a.pFg, flex: "none", marginTop: "2px" }}>{a.p}</span>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.35, textWrap: "pretty" }}>{a.hook}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "11px", color: "var(--mut)" }}>
                    <span>Topic: <span style={{ color: "var(--text)" }}>{a.topic}</span></span>
                    <span>Quality <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, color: a.qC }}>{a.q}</span></span>
                    <span style={{ color: a.fC }}>● {a.fact}</span>
                    <span>{a.src} sources</span>
                    <span>Suggested {a.when}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "7px", flex: "none" }}>
                  <button style={{ font: "inherit", fontSize: "11.5px", fontWeight: 600, padding: "6px 13px", borderRadius: "6px", border: "none", background: "var(--grn)", color: "#06251a", cursor: "pointer" }}>Approve</button>
                  <button style={{ font: "inherit", fontSize: "11.5px", padding: "6px 11px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: "var(--mut)", cursor: "pointer" }}>Request changes</button>
                  <button style={{ font: "inherit", fontSize: "11.5px", padding: "6px 11px", borderRadius: "6px", border: "1px solid transparent", background: "transparent", color: "var(--red)", cursor: "pointer" }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Runs */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Active Swarm Runs</span>
            <span style={{ fontSize: "10.5px", fontWeight: 600, background: "var(--accbg)", color: "var(--acc)", borderRadius: "9px", padding: "1px 8px" }}>4 running</span>
            <div style={{ flex: 1 }}></div>
            <a href="#" style={{ fontSize: "11.5px" }}>Open Temporal UI ↗</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {runs.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(160px,1.3fr) 90px minmax(140px,1fr) 64px 60px", gap: "14px", alignItems: "center", padding: "11px 16px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "2px" }}>{r.agent}</div>
                </div>
                <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "9px", background: "var(--accbg)", color: "var(--acc)", justifySelf: "start" }}>{r.stage}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--chip)", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: "3px", background: "var(--acc)", width: `${r.pct}%` }}></div></div>
                  <span style={{ fontSize: "11px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--mut)", width: "32px", textAlign: "right" }}>{r.pct}%</span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--mut)", fontFamily: "'IBM Plex Mono',monospace" }}>{r.dur}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--acc)" }}><span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--acc)", animation: "shimmer 1.6s ease-in-out infinite" }}></span>Live</span>
              </div>
            ))}
          </div>
        </section>

        {/* Signals */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Research &amp; Trend Signals</span>
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>27 signals found · SearXNG + social listening</span>
            <div style={{ flex: 1 }}></div>
            <a href="#" onClick={(e) => { e.preventDefault(); onGoPage('research'); }} style={{ fontSize: "11.5px" }}>All research</a>
          </div>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,2fr) 70px 60px 64px 84px 70px 92px", gap: "12px", padding: "8px 16px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", borderBottom: "1px solid var(--line)" }}>
              <span>Topic</span><span>Score</span><span>Trend</span><span>Sources</span><span>Relevance</span><span>Platform</span><span></span>
            </div>
            {signals.map((g, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(220px,2fr) 70px 60px 64px 84px 70px 92px", gap: "12px", alignItems: "center", padding: "9px 16px", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 500, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.topic}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "12px", fontWeight: 600, color: g.sC }}>{g.score}</span>
                <span style={{ fontSize: "11.5px", color: g.dC }}>{g.dir}</span>
                <span style={{ fontSize: "11.5px", color: "var(--mut)", fontFamily: "'IBM Plex Mono',monospace" }}>{g.src}</span>
                <span style={{ fontSize: "11px", color: "var(--mut)" }}>{g.rel}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, width: "18px", height: "18px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: g.pBg, color: g.pFg }}>{g.p}</span>
                <button style={{ font: "inherit", fontSize: "11px", fontWeight: 600, padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: "var(--acc)", cursor: "pointer", justifySelf: "end" }}>Create draft</button>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly calendar preview */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Scheduled This Week</span>
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>Jul 13 – 19 · drag to reschedule</span>
            <div style={{ flex: 1 }}></div>
            <a href="#" onClick={(e) => { e.preventDefault(); onGoPage('calendar'); }} style={{ fontSize: "11.5px" }}>Open calendar</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0, padding: "0 4px" }}>
            {days.map((d, i) => (
              <div key={i} style={{ borderRight: "1px solid var(--line)", padding: "10px 8px 14px", display: "flex", flexDirection: "column", gap: "7px", minHeight: "118px", background: d.bg }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", color: d.hC }}>{d.d}</span>
                  <span style={{ fontSize: "10.5px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--faint)" }}>{d.n}</span>
                </div>
                {d.chips?.map((c, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", padding: "5px 7px", borderRadius: "6px", background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, cursor: "grab" }}>
                    <span style={{ fontWeight: 700, fontSize: "9px" }}>{c.p}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{c.t}</span>
                    <span style={{ marginLeft: "auto" }}>{c.mark}</span>
                  </div>
                ))}
                {d.empty && (
                  <div style={{ fontSize: "10.5px", color: "var(--faint)", border: "1px dashed var(--line2)", borderRadius: "6px", padding: "5px 7px", textAlign: "center", cursor: "pointer" }}>+ slot</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recent Performance */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Recent Performance</span>
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>Last 7 days</span>
            <div style={{ flex: 1 }}></div>
            <a href="#" onClick={(e) => { e.preventDefault(); onGoPage('analytics'); }} style={{ fontSize: "11.5px" }}>Full analytics</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(108px,1fr))", gap: "10px", padding: "14px 16px 6px" }}>
            {perf.map((m, i) => (
              <div key={i} style={{ background: "var(--card2)", border: "1px solid var(--line)", borderRadius: "9px", padding: "10px 12px" }}>
                <div style={{ fontSize: "10.5px", color: "var(--mut)" }}>{m.label}</div>
                <div style={{ fontSize: "17px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", marginTop: "3px" }}>{m.val}</div>
                <div style={{ fontSize: "10.5px", color: m.c, marginTop: "2px" }}>{m.delta}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", padding: "10px 16px 16px" }}>
            <div style={{ flex: "1 1 280px", border: "1px solid var(--line)", borderRadius: "9px", padding: "12px 14px", background: "var(--card2)" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", marginBottom: "8px" }}>Best performing post</div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, width: "20px", height: "20px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#0a66c2", color: "#fff", flex: "none" }}>in</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, lineHeight: 1.35 }}>Why approval gates matter in AI publishing</div>
                  <div style={{ fontSize: "11px", color: "var(--mut)", marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" }}><span>18.4K impressions</span><span>6.2% engagement</span><span>Tue 9:15 AM</span></div>
                </div>
              </div>
            </div>
            <div style={{ flex: "1 1 240px", border: "1px solid var(--line)", borderRadius: "9px", padding: "12px 14px", background: "var(--card2)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)" }}>Platform engagement</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--mut)" }}><span>LinkedIn</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>5.4%</span></div>
                <div style={{ height: "6px", borderRadius: "3px", background: "var(--chip)" }}><div style={{ height: "100%", width: "72%", borderRadius: "3px", background: "#3a8dde" }}></div></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--mut)" }}><span>X / Twitter</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>3.1%</span></div>
                <div style={{ height: "6px", borderRadius: "3px", background: "var(--chip)" }}><div style={{ height: "100%", width: "41%", borderRadius: "3px", background: "var(--mut)" }}></div></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sidebar Info columns */}
      <aside style={{ flex: "1 1 260px", maxWidth: "312px", minWidth: "250px", display: "flex", flexDirection: "column", gap: "18px" }}>
        
        {/* System Health */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>System Health</span>
            <div style={{ flex: 1 }}></div>
            <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "9px", background: v('ambbg'), color: v('amb') }}>Worker degraded</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "6px 0" }}>
            {services.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.c, flex: "none" }}></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--faint)" }}>checked {s.at}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: s.c }}>{s.status}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--mut)", fontFamily: "'IBM Plex Mono',monospace" }}>{s.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity Widget */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Activity</span>
            <div style={{ flex: 1 }}></div>
            <a href="#" style={{ fontSize: "11.5px" }}>All activity</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "10px 16px 14px", gap: 0 }}>
            {activity.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: e.c, flex: "none", marginTop: "5px" }}></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11.5px", lineHeight: 1.45, color: "var(--text)" }}>{e.msg}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--faint)", marginTop: "2px", fontFamily: "'IBM Plex Mono',monospace" }}>{e.t}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
