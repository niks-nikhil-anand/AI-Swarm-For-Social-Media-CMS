"use client";

interface CalendarGridProps {
  theme: string;
}

type CalendarCell = {
  has: boolean;
  empty: boolean;
  p?: string;
  pBg?: string;
  pFg?: string;
  title?: string;
  bg?: string;
  bd?: string;
  fg?: string;
  mark?: string;
  cellBg?: string;
};

export function CalendarGrid({ theme }: CalendarGridProps) {
  const v = (n: string) => `var(--${n})`;
  
  const IN = { p: 'in', pBg: '#0a66c2', pFg: '#fff' };
  const X = { p: 'X', pBg: theme === 'light' ? '#17202f' : '#e8edf6', pFg: theme === 'light' ? '#fff' : '#0a0e16' };
  const pf = (k: string) => k === 'in' ? IN : X;

  const pub = (p: string, title: string) => ({ has: true, empty: false, ...pf(p), title, bg: 'var(--grnbg)', bd: 'transparent', fg: 'var(--grn)', mark: '✓' });
  const sched = (p: string, title: string) => ({ has: true, empty: false, ...pf(p), title, bg: 'var(--accbg)', bd: 'transparent', fg: 'var(--acc)', mark: '' });
  const wait = (p: string, title: string) => ({ has: true, empty: false, ...pf(p), title, bg: 'var(--ambbg)', bd: 'transparent', fg: 'var(--amb)', mark: '…' });
  const fail = (p: string, title: string) => ({ has: true, empty: false, ...pf(p), title, bg: 'var(--redbg)', bd: 'var(--red)', fg: 'var(--red)', mark: '!' });
  const empty = () => ({ has: false, empty: true });
  const none = () => ({ has: false, empty: false });

  const today = (i: number) => i === 5 ? 'var(--card2)' : 'transparent';
  const cells = (arr: CalendarCell[]) => arr.map((c, i) => ({ ...c, cellBg: today(i) }));

  const calHead = [
    { d: 'Mon', n: '13' }, { d: 'Tue', n: '14' }, { d: 'Wed', n: '15' }, { d: 'Thu', n: '16' },
    { d: 'Fri', n: '17' }, { d: 'Sat', n: '18', today: true }, { d: 'Sun', n: '19' },
  ].map(h => ({ ...h, bg: h.today ? v('card2') : 'transparent', hC: h.today ? v('acc') : v('mut') }));

  const calRows = [
    { label: 'Morning', time: '9:15 AM', cells: cells([
      pub('in', 'Agent swarm teardown'), pub('in', 'Approval gates'), pub('X', 'Listening playbook'), none(),
      pub('in', 'Founder brand loop'), sched('in', 'AI agents for teams'), empty(),
    ]) },
    { label: 'Afternoon', time: '1:30 PM', cells: cells([
      none(), pub('in', 'Research automation'), empty(), pub('in', 'Pain-point mining'),
      none(), wait('in', 'Approval gates v2'), empty(),
    ]) },
    { label: 'Evening', time: '6:45 PM', cells: cells([
      pub('X', 'Content ops thread'), none(), empty(), fail('X', 'Listening poll'),
      pub('X', 'Metrics recap'), sched('X', 'Automation thread'), wait('X', 'B2B playbook'),
    ]) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1240px" }}>
      
      {/* Calendar Header Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button style={{ font: "inherit", fontSize: "12px", padding: "6px 11px", borderRadius: "7px", border: "1px solid var(--line2)", background: "var(--card)", color: "var(--mut)", cursor: "pointer" }}>‹</button>
        <span style={{ fontSize: "13px", fontWeight: 600, padding: "0 4px" }}>Jul 13 – 19, 2026</span>
        <button style={{ font: "inherit", fontSize: "12px", padding: "6px 11px", borderRadius: "7px", border: "1px solid var(--line2)", background: "var(--card)", color: "var(--mut)", cursor: "pointer" }}>›</button>
        <button style={{ font: "inherit", fontSize: "12px", fontWeight: 600, padding: "6px 12px", borderRadius: "7px", border: "1px solid var(--line2)", background: "var(--card)", color: "var(--acc)", cursor: "pointer" }}>Today</button>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "var(--mut)", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--grn)" }}></span>Published</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--acc)" }}></span>Scheduled</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--amb)" }}></span>Awaiting approval</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--red)" }}></span>Failed</span>
        </div>
      </div>

      {/* Grid view */}
      <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <div style={{ minWidth: "940px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "110px repeat(7, 1fr)" }}>
            <div style={{ borderBottom: "1px solid var(--line)", padding: "10px 12px" }}></div>
            {calHead.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--line)", borderLeft: "1px solid var(--line)", padding: "10px 10px", display: "flex", alignItems: "baseline", gap: "6px", background: h.bg }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: h.hC }}>{h.d}</span>
                <span style={{ fontSize: "11px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--faint)" }}>{h.n}</span>
                {h.today && <span style={{ fontSize: "9.5px", fontWeight: 600, padding: "1px 6px", borderRadius: "8px", background: "var(--accbg)", color: "var(--acc)" }}>TODAY</span>}
              </div>
            ))}
          </div>

          {calRows.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "110px repeat(7, 1fr)" }}>
              <div style={{ borderBottom: "1px solid var(--line)", padding: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--mut)" }}>{r.label}</span>
                <span style={{ fontSize: "10.5px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--faint)" }}>{r.time}</span>
              </div>
              {r.cells.map((c, idx) => (
                <div key={idx} style={{ borderBottom: "1px solid var(--line)", borderLeft: "1px solid var(--line)", padding: "8px", minHeight: "74px", background: c.cellBg }}>
                  {c.has && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "10.5px", padding: "7px 8px", borderRadius: "7px", background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, cursor: "grab" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ fontWeight: 700, fontSize: "9px" }}>{c.p}</span><span style={{ marginLeft: "auto" }}>{c.mark}</span></div>
                      <div style={{ fontWeight: 500, lineHeight: 1.3, color: "var(--text)", fontSize: "11px" }}>{c.title}</div>
                    </div>
                  )}
                  {c.empty && (
                    <div style={{ height: "100%", minHeight: "56px", fontSize: "10.5px", color: "var(--faint)", border: "1px dashed var(--line2)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>+ add</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div style={{ fontSize: "11px", color: "var(--faint)" }}>Drag a post to another cell to reschedule. Publishing runs through Postiz at slot time.</div>
    </div>
  );
}
