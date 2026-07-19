"use client";

import { useState } from "react";

interface PublishedPostsProps {
  theme: string;
}

export function PublishedPosts({ theme }: PublishedPostsProps) {
  const v = (n: string) => `var(--${n})`;
  
  const IN = { p: 'in', pBg: '#0a66c2', pFg: '#fff' };
  const X = { p: 'X', pBg: theme === 'light' ? '#17202f' : '#e8edf6', pFg: theme === 'light' ? '#fff' : '#0a0e16' };
  const pf = (k: string) => k === 'in' ? IN : X;

  const pubStats = [
    { label: 'Posts published', val: '11', sub: 'last 14 days', c: v('faint') },
    { label: 'Total impressions', val: '96.4K', sub: '+18% vs prior', c: v('grn') },
    { label: 'Avg engagement', val: '4.4%', sub: '+0.3 pts', c: v('grn') },
    { label: 'Followers gained', val: '+347', sub: 'both platforms', c: v('grn') },
  ];

  const publishedPosts = [
    { p: 'in', title: 'Why approval gates matter in AI publishing', at: 'Tue 9:15a', impr: '18.4K', eng: '6.2%', eC: 'grn', likes: 412, com: 88, rep: 96, clk: 231, best: true, snippet: 'Your content team isn’t slow — your approval loop is. Why one human gate saved us twice last month…' },
    { p: 'in', title: 'Using social listening to find customer pain points', at: 'Thu 1:30p', impr: '12.1K', eng: '5.1%', eC: 'grn', likes: 287, com: 41, rep: 52, clk: 164, best: false, snippet: 'Your roadmap is hiding in your replies. How we mine comments, reviews and support tickets for signal…' },
    { p: 'X', title: 'Content ops thread — how the swarm works', at: 'Mon 6:45p', impr: '9.8K', eng: '4.0%', eC: 'grn', likes: 198, com: 22, rep: 61, clk: 87, best: false, snippet: '3 posts a day, zero hands on keyboard until approval. A thread on the pipeline behind this account…' },
    { p: 'in', title: 'Founder brand loop: post daily without burning out', at: 'Fri 9:15a', impr: '8.6K', eng: '4.3%', eC: 'grn', likes: 176, com: 34, rep: 28, clk: 92, best: false, snippet: 'Daily posting is a system problem, not a discipline problem. The loop that keeps our founder visible…' },
    { p: 'X', title: 'Listening playbook — 8 tweets', at: 'Wed 9:15a', impr: '7.2K', eng: '3.4%', eC: 'amb', likes: 141, com: 12, rep: 44, clk: 51, best: false, snippet: '8 tweets on turning social listening into a weekly content engine. Steal the whole playbook…' },
    { p: 'in', title: 'Research automation for tiny marketing teams', at: 'Tue 1:30p', impr: '6.9K', eng: '3.9%', eC: 'grn', likes: 129, com: 26, rep: 19, clk: 73, best: false, snippet: 'A 1-person marketing team can out-research a 10-person one. The stack: SearXNG + scoring agents…' },
    { p: 'X', title: 'Weekly metrics recap — building in public', at: 'Fri 6:45p', impr: '5.4K', eng: '2.8%', eC: 'amb', likes: 96, com: 9, rep: 27, clk: 34, best: false, snippet: 'Week 28 in public: +182 followers, 4.6% engagement, one failed post and what we changed…' },
    { p: 'in', title: 'Pain-point mining from support tickets', at: 'Thu 1:30p', impr: '4.8K', eng: '3.1%', eC: 'amb', likes: 88, com: 17, rep: 12, clk: 41, best: false, snippet: 'Support tickets are unfiltered voice-of-customer. Three prompts we use to cluster them into topics…' },
    { p: 'X', title: 'Agent swarm teardown — quote thread', at: 'Mon 9:15a', impr: '4.1K', eng: '2.6%', eC: 'amb', likes: 74, com: 6, rep: 18, clk: 22, best: false, snippet: 'Quote thread: every agent in our swarm, what it does, and where humans stay in the loop…' },
  ].map(r => ({ ...r, ...pf(r.p) }));

  const [pubView, setPubView] = useState<'table' | 'cards'>('table');

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1240px" }}>
      
      {/* KPI Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "10px" }}>
        {pubStats.map((k, i) => (
          <div key={i} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", padding: "12px 14px", boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: "11px", color: "var(--mut)" }}>{k.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
              <span style={{ fontSize: "21px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{k.val}</span>
              <span style={{ fontSize: "11px", color: k.c }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Switcher & Export */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          <button onClick={() => setPubView('table')} style={{ font: "inherit", fontSize: "11.5px", fontWeight: 600, padding: "5px 13px", borderRadius: "6px", border: "none", background: pubView === 'table' ? v('accbg') : 'transparent', color: pubView === 'table' ? v('acc') : v('mut'), cursor: "pointer" }}>Table</button>
          <button onClick={() => setPubView('cards')} style={{ font: "inherit", fontSize: "11.5px", fontWeight: 600, padding: "5px 13px", borderRadius: "6px", border: "none", background: pubView === 'cards' ? v('accbg') : 'transparent', color: pubView === 'cards' ? v('acc') : v('mut'), cursor: "pointer" }}>Cards</button>
        </div>
        <span style={{ fontSize: "11px", color: "var(--faint)" }}>last 14 days · 9 posts</span>
        <div style={{ flex: 1 }}></div>
        <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: "11.5px" }}>Export CSV</a>
      </div>

      {/* Cards View */}
      {pubView === 'cards' && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "14px" }}>
          {publishedPosts.map((q, idx) => (
            <div key={idx} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)", padding: "14px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, width: "19px", height: "19px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: q.pBg, color: q.pFg, flex: "none" }}>{q.p}</span>
                <span style={{ fontSize: "11px", color: "var(--faint)", fontFamily: "'IBM Plex Mono',monospace" }}>{q.at}</span>
                <div style={{ flex: 1 }}></div>
                {q.best && <span style={{ fontSize: "9.5px", fontWeight: 600, padding: "1px 6px", borderRadius: "8px", background: "var(--grnbg)", color: "var(--grn)" }}>TOP POST</span>}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.35, textWrap: "pretty" }}>{q.title}</div>
              <div style={{ fontSize: "11.5px", color: "var(--mut)", lineHeight: 1.5, flex: 1 }}>{q.snippet}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
                <div><div style={{ fontSize: "10px", color: "var(--faint)" }}>Impressions</div><div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{q.impr}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--faint)" }}>Engagement</div><div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: v(q.eC) }}>{q.eng}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--faint)" }}>Clicks</div><div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{q.clk}</div></div>
              </div>
              <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--mut)", alignItems: "center" }}>
                <span style={{ whiteSpace: "nowrap" }}>{q.likes} likes</span><span style={{ whiteSpace: "nowrap" }}>{q.com} comments</span><span style={{ whiteSpace: "nowrap" }}>{q.rep} reposts</span>
                <a href="#" style={{ marginLeft: "auto", fontWeight: 600, fontSize: "11px", whiteSpace: "nowrap" }}>View ↗</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {pubView === 'table' && (
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)", overflowX: "auto" }}>
          <div style={{ minWidth: "1020px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(250px,2.2fr) 92px 78px 72px 62px 66px 62px 60px 96px", gap: "12px", padding: "8px 16px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", borderBottom: "1px solid var(--line)" }}>
              <span>Post</span><span>Published</span><span>Impr.</span><span>Engage</span><span>Likes</span><span>Comments</span><span>Reposts</span><span>Clicks</span><span></span>
            </div>
            {publishedPosts.map((q, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "minmax(250px,2.2fr) 92px 78px 72px 62px 66px 62px 60px 96px", gap: "12px", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0 }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, width: "19px", height: "19px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: q.pBg, color: q.pFg, flex: "none" }}>{q.p}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.title}</div>
                    {q.best && <span style={{ fontSize: "9.5px", fontWeight: 600, padding: "1px 6px", borderRadius: "8px", background: "var(--grnbg)", color: "var(--grn)", marginTop: "2px", display: "inline-block" }}>TOP POST</span>}
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "var(--mut)", fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "nowrap" }}>{q.at}</span>
                <span style={{ fontSize: "12px", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{q.impr}</span>
                <span style={{ fontSize: "12px", fontFamily: "'IBM Plex Mono',monospace", color: v(q.eC) }}>{q.eng}</span>
                <span style={{ fontSize: "11.5px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--mut)" }}>{q.likes}</span>
                <span style={{ fontSize: "11.5px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--mut)" }}>{q.com}</span>
                <span style={{ fontSize: "11.5px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--mut)" }}>{q.rep}</span>
                <span style={{ fontSize: "11.5px", fontFamily: "'IBM Plex Mono',monospace", color: "var(--mut)" }}>{q.clk}</span>
                <div style={{ display: "flex", gap: "6px", justifySelf: "end" }}>
                  <a href="#" style={{ fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>View ↗</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
