"use client";

import { useState } from "react";

interface ContentQueueProps {
  theme: string;
}

type QueueStatus = 'Drafting' | 'Needs approval' | 'Approved' | 'Scheduled' | 'Published' | 'Failed';

type StatusStyle = {
  stBg: string;
  stFg: string;
  action: string;
  aBg: string;
  aFg: string;
};

export function ContentQueue({ theme }: ContentQueueProps) {
  const v = (n: string) => `var(--${n})`;
  
  const IN = { p: 'in', pBg: '#0a66c2', pFg: '#fff' };
  const X = { p: 'X', pBg: theme === 'light' ? '#17202f' : '#e8edf6', pFg: theme === 'light' ? '#fff' : '#0a0e16' };
  const pf = (k: string) => k === 'in' ? IN : X;

  const st: Record<QueueStatus, StatusStyle> = {
    'Drafting': { stBg: v('accbg'), stFg: v('acc'), action: 'Watch run', aBg: v('chip'), aFg: v('text') },
    'Needs approval': { stBg: v('ambbg'), stFg: v('amb'), action: 'Review', aBg: v('amb'), aFg: '#2b1d02' },
    'Approved': { stBg: v('grnbg'), stFg: v('grn'), action: 'Schedule', aBg: v('acc'), aFg: '#08111f' },
    'Scheduled': { stBg: v('grnbg'), stFg: v('grn'), action: 'Reschedule', aBg: v('chip'), aFg: v('text') },
    'Published': { stBg: v('chip'), stFg: v('mut'), action: 'View stats', aBg: v('chip'), aFg: v('text') },
    'Failed': { stBg: v('redbg'), stFg: v('red'), action: 'Retry', aBg: v('red'), aFg: '#fff' },
  };

  const row = (p: string, title: string, hook: string, topic: string, status: QueueStatus, q: string, qC: string, fact: string, fC: string, when: string) =>
    ({ ...pf(p), title, hook, topic, status, q, qC: v(qC), fact, fC: v(fC), when, ...st[status] });

  const allQueue = [
    row('X', 'How founders can automate content research', 'Drafting in progress — copywriter-v2 at 81%', 'Content automation', 'Drafting', '—', 'faint', 'Pending', 'faint', 'Today 6:45 PM'),
    row('in', 'Why approval gates matter in AI publishing', '"Your content team isn\'t slow — your approval loop is."', 'AI publishing workflows', 'Needs approval', '8.7', 'grn', 'Passed', 'grn', 'Today 1:30 PM'),
    row('X', 'LinkedIn content systems for B2B startups', 'A 5-step playbook thread for founders', 'B2B content systems', 'Needs approval', '7.9', 'amb', '1 flag', 'amb', 'Sun 9:15 AM'),
    row('in', 'AI agents for social media teams', 'What a 3-person team ships with an agent swarm', 'AI agents', 'Scheduled', '9.1', 'grn', 'Passed', 'grn', 'Today 9:15 AM'),
    row('X', 'AI agents for social media teams', 'Thread version — 8 tweets, CTA to newsletter', 'AI agents', 'Approved', '8.4', 'grn', 'Passed', 'grn', 'Unassigned'),
    row('in', 'Using social listening to find customer pain points', 'Mining replies and reviews for roadmap signals', 'Social listening', 'Published', '8.2', 'grn', 'Passed', 'grn', 'Thu 1:30 PM'),
    row('X', 'Using social listening to find customer pain points', 'Short version with poll', 'Social listening', 'Failed', '8.0', 'grn', 'Passed', 'grn', 'Thu 6:45 PM'),
    row('in', 'Approval gates — carousel recap', 'Slide carousel of the approval-gates post', 'AI publishing workflows', 'Drafting', '—', 'faint', 'Pending', 'faint', 'Mon 9:15 AM'),
  ];

  const [qFilter, setQFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const statuses = ['All', 'Drafting', 'Needs approval', 'Approved', 'Scheduled', 'Published', 'Failed'];

  const filteredQueue = allQueue.filter(q => {
    const matchesFilter = qFilter === 'All' || q.status === qFilter;
    const matchesSearch = searchQuery === '' || 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1240px" }}>
      
      {/* Search & Tabs Row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          {statuses.map(s => {
            const on = s === qFilter;
            const count = s === 'All' ? allQueue.length : allQueue.filter(q => q.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setQFilter(s)}
                style={{
                  font: "inherit", fontSize: "12px", fontWeight: on ? 600 : 400,
                  padding: "6px 12px", borderRadius: "7px", border: "1px solid transparent",
                  background: on ? v('accbg') : 'transparent',
                  color: on ? v('acc') : v('mut'), cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "7px", whiteSpace: "nowrap"
                }}
              >
                {s}
                <span style={{ fontSize: "10.5px", fontFamily: "'IBM Plex Mono',monospace", opacity: 0.75 }}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }}></div>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search content…"
          style={{
            font: "inherit", fontSize: "12px", padding: "7px 12px",
            borderRadius: "7px", border: "1px solid var(--line2)",
            background: "var(--card)", color: "var(--text)", width: "200px", outline: "none"
          }}
        />
      </div>

      {/* Queue Table */}
      <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <div style={{ minWidth: "990px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "28px minmax(260px,2.2fr) minmax(120px,1fr) 110px 62px 96px 96px 118px", gap: "12px", padding: "9px 16px", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", borderBottom: "1px solid var(--line)" }}>
            <span></span><span>Post</span><span>Topic</span><span>Status</span><span>Quality</span><span>Fact-check</span><span>Slot</span><span></span>
          </div>

          {filteredQueue.length === 0 ? (
            <div style={{ padding: "48px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--card2)", border: "1px dashed var(--line2)" }}></span>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>Nothing here</div>
              <div style={{ fontSize: "11.5px", color: "var(--mut)" }}>No content matches this filter. New drafts appear as swarm runs finish writing.</div>
            </div>
          ) : (
            filteredQueue.map((q, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "28px minmax(260px,2.2fr) minmax(120px,1fr) 110px 62px 96px 96px 118px", gap: "12px", alignItems: "center", padding: "11px 16px", borderBottom: "1px solid var(--line)" }}>
                <input type="checkbox" style={{ width: "14px", height: "14px", accentColor: "var(--acc)", cursor: "pointer" }} />
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", minWidth: 0 }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, width: "19px", height: "19px", borderRadius: "4px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: q.pBg, color: q.pFg, flex: "none", marginTop: "1px" }}>{q.p}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>{q.hook}</div>
                  </div>
                </div>
                <span style={{ fontSize: "11.5px", color: "var(--mut)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.topic}</span>
                <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "9px", background: q.stBg, color: q.stFg, justifySelf: "start", whiteSpace: "nowrap" }}>{q.status}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "12px", fontWeight: 600, color: q.qC }}>{q.q}</span>
                <span style={{ fontSize: "11px", color: q.fC }}>{q.fact}</span>
                <span style={{ fontSize: "11px", color: "var(--mut)", fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "nowrap" }}>{q.when}</span>
                <div style={{ display: "flex", gap: "6px", justifySelf: "end" }}>
                  <button style={{ font: "inherit", fontSize: "11px", fontWeight: 600, padding: "5px 10px", borderRadius: "6px", border: "none", background: q.aBg, color: q.aFg, cursor: "pointer", whiteSpace: "nowrap" }}>{q.action}</button>
                  <button style={{ font: "inherit", fontSize: "11px", padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: "var(--mut)", cursor: "pointer" }}>⋯</button>
                </div>
              </div>
            ))
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", fontSize: "11px", color: "var(--faint)" }}>
            <span style={{ whiteSpace: "nowrap" }}>{filteredQueue.length} item{filteredQueue.length === 1 ? '' : 's'}</span>
            <div style={{ flex: 1 }}></div>
            <span style={{ whiteSpace: "nowrap" }}>Sorted by slot time</span>
          </div>
        </div>
      </section>
    </div>
  );
}
