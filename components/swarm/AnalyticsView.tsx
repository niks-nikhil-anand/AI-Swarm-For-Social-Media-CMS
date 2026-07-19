"use client";

import { useState } from "react";

interface AnalyticsViewProps {
  theme: string;
}

export function AnalyticsView({ theme }: AnalyticsViewProps) {
  const v = (n: string) => `var(--${n})`;
  
  const IN = { p: 'in', pBg: '#0a66c2', pFg: '#fff' };
  const X = { p: 'X', pBg: theme === 'light' ? '#17202f' : '#e8edf6', pFg: theme === 'light' ? '#fff' : '#0a0e16' };
  const pf = (k: string) => k === 'in' ? IN : X;

  const [anRange, setAnRange] = useState('14 days');
  const ranges = ['7 days', '14 days', '30 days'];

  const stats = [
    { label: 'Impressions', val: '96.4K', sub: '+18%', c: v('grn') },
    { label: 'Engagement rate', val: '4.4%', sub: '+0.3 pts', c: v('grn') },
    { label: 'Link clicks', val: '1,842', sub: '+11%', c: v('grn') },
    { label: 'Followers gained', val: '+347', sub: '+22%', c: v('grn') },
    { label: 'Posts published', val: '11', sub: 'of 12 planned', c: v('amb') },
  ];

  const anBars = [
    { d: '5', li: 44, x: 22 }, { d: '6', li: 30, x: 15 }, { d: '7', li: 58, x: 26 }, { d: '8', li: 40, x: 31 }, 
    { d: '9', li: 66, x: 24 }, { d: '10', li: 35, x: 12 }, { d: '11', li: 20, x: 9 }, { d: '12', li: 52, x: 28 }, 
    { d: '13', li: 47, x: 19 }, { d: '14', li: 88, x: 34 }, { d: '15', li: 61, x: 27 }, { d: '16', li: 55, x: 38 }, 
    { d: '17', li: 49, x: 21 }, { d: '18', li: 26, x: 10 }
  ];

  const anCompare = [
    { label: 'Impressions', li: 58, x: 42, liV: '55.9K', xV: '40.5K' },
    { label: 'Engagement rate', li: 63, x: 37, liV: '5.4%', xV: '3.1%' },
    { label: 'Link clicks', li: 66, x: 34, liV: '1,214', xV: '628' },
    { label: 'Followers gained', li: 62, x: 38, liV: '+214', xV: '+133' },
  ];

  const anTop = [
    { i: '1', title: 'Why approval gates matter in AI publishing', pct: 100, eng: '6.2%', p: 'in' },
    { i: '2', title: 'Using social listening to find customer pain points', pct: 82, eng: '5.1%', p: 'in' },
    { i: '3', title: 'Founder brand loop: post daily without burning out', pct: 69, eng: '4.3%', p: 'in' },
    { i: '4', title: 'Content ops thread — how the swarm works', pct: 65, eng: '4.0%', p: 'X' },
  ].map(t => ({ ...t, ...pf(t.p) }));

  const anFollow = [22, 30, 26, 38, 45, 34, 28, 52, 48, 70, 58, 64, 82, 100];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1240px" }}>
      
      {/* Date Select & Export Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          {ranges.map(l => {
            const on = l === anRange;
            return (
              <button
                key={l}
                onClick={() => setAnRange(l)}
                style={{
                  font: "inherit", fontSize: "11.5px", fontWeight: 600,
                  padding: "5px 13px", borderRadius: "6px", border: "none",
                  background: on ? v('accbg') : 'transparent',
                  color: on ? v('acc') : v('mut'), cursor: "pointer", whiteSpace: "nowrap"
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }}></div>
        <a href="#" style={{ fontSize: "11.5px" }}>Export report</a>
      </div>

      {/* KPI Stats Grid */}
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

      {/* Impressions & Platform Comparison charts */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "stretch" }}>
        
        {/* Impressions Stacked Chart */}
        <section style={{ flex: "2 1 480px", minWidth: 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Impressions by day</span>
            <div style={{ flex: 1 }}></div>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--mut)" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#3a8dde" }}></span>LinkedIn</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--mut)" }}><span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--acc)", opacity: 0.55 }}></span>X / Twitter</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", padding: "20px 16px 8px", height: "190px" }}>
            {anBars.map((b, idx) => (
              <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "2px", height: "100%" }} title={`Jul ${b.d}`}>
                <div style={{ borderRadius: "3px 3px 0 0", background: "#3a8dde", height: `${b.li}%` }}></div>
                <div style={{ borderRadius: "0 0 2px 2px", background: "var(--acc)", opacity: 0.55, height: `${b.x}%` }}></div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", padding: "0 16px 14px" }}>
            {anBars.map((b, idx) => (
              <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: "9.5px", color: "var(--faint)", fontFamily: "'IBM Plex Mono',monospace" }}>{b.d}</div>
            ))}
          </div>
        </section>

        {/* Platform Comparison progress bars */}
        <section style={{ flex: "1 1 280px", minWidth: "260px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontSize: "13.5px", fontWeight: 600 }}>Platform comparison</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "14px 16px", flex: 1 }}>
            {anCompare.map((c, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--mut)" }}>
                  <span>{c.label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>{c.liV} · {c.xV}</span>
                </div>
                <div style={{ display: "flex", height: "7px", borderRadius: "4px", overflow: "hidden", background: "var(--chip)" }}>
                  <div style={{ background: "#3a8dde", width: `${c.li}%` }}></div>
                  <div style={{ background: "var(--acc)", opacity: 0.55, width: `${c.x}%` }}></div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: "auto", fontSize: "11px", color: "var(--faint)", lineHeight: 1.5 }}>LinkedIn drives 2.1× the engagement per post; X drives 1.7× the reach per follower.</div>
          </div>
        </section>
      </div>

      {/* Top Posts & Follower growth charts */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        
        {/* Top Posts List */}
        <section style={{ flex: "2 1 460px", minWidth: 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Top posts by engagement</span>
            <div style={{ flex: 1 }}></div>
            <a href="#" style={{ fontSize: "11.5px" }}>Published posts</a>
          </div>
          {anTop.map((t, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: "11px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--faint)", width: "16px" }}>{t.i}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, width: "19px", height: "19px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: t.pBg, color: t.pFg, flex: "none" }}>{t.p}</span>
              <span style={{ flex: 1, fontSize: "12.5px", fontWeight: 500, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
              <div style={{ width: "110px", height: "6px", borderRadius: "3px", background: "var(--chip)", overflow: "hidden", flex: "none" }}>
                <div style={{ height: "100%", background: "var(--grn)", width: `${t.pct}%`, borderRadius: "3px" }}></div>
              </div>
              <span style={{ fontSize: "12px", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, color: "var(--grn)", width: "42px", textAlign: "right" }}>{t.eng}</span>
            </div>
          ))}
        </section>

        {/* Follower Growth bar charts */}
        <section style={{ flex: "1 1 280px", minWidth: "260px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontSize: "13.5px", fontWeight: 600 }}>Follower growth</div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "26px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>+347</span>
              <span style={{ fontSize: "11px", color: "var(--grn)" }}>+22% vs prior period</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "70px" }}>
              {anFollow.map((f, idx) => (
                <div key={idx} style={{ flex: 1, borderRadius: "2px 2px 0 0", background: "var(--grn)", opacity: 0.75, height: `${f}%` }}></div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--faint)", fontFamily: "'IBM Plex Mono',monospace" }}><span>Jul 5</span><span>Jul 18</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--mut)", borderTop: "1px solid var(--line)", paddingTop: "10px" }}><span>LinkedIn</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>+214</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--mut)" }}><span>X / Twitter</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--text)" }}>+133</span></div>
          </div>
        </section>

      </div>

    </div>
  );
}
