"use client";

import { useState } from "react";

interface SettingsPanelProps {
  theme: string;
}

export function SettingsPanel({ theme }: SettingsPanelProps) {
  const v = (n: string) => `var(--${n})`;

  const setNav = ['Publishing plan', 'Approvals & safety', 'Connected accounts', 'Integrations', 'Workspace', 'Billing']
    .map((l, i) => ({ label: l, fg: i === 0 ? v('acc') : v('mut'), bg: i === 0 ? v('accbg') : 'transparent', w: i === 0 ? 600 : 400 }));

  const [postsPerDay, setPostsPerDay] = useState(3);
  const setPerDay = [1, 2, 3, 4].map(n => ({
    v: n,
    bg: n === postsPerDay ? v('acc') : 'transparent',
    fg: n === postsPerDay ? '#08111f' : v('mut')
  }));

  const setSlots = [
    { label: 'Morning', time: '9:15 AM', note: 'Highest LinkedIn reach' },
    { label: 'Afternoon', time: '1:30 PM', note: 'Peak X activity' },
    { label: 'Evening', time: '6:45 PM', note: 'Long-form engagement' },
  ];

  // Safety & approvals toggles
  const [safetyToggles, setSafetyToggles] = useState<Record<string, boolean>>({
    gate: true, // locked
    fact: true,
    notify: true,
    autoslot: true,
    pause: false,
  });

  const toggleHandler = (key: string, locked?: boolean) => {
    if (locked) return;
    setSafetyToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const setToggles = [
    { key: 'gate', label: 'Require human approval before scheduling', note: 'Locked on — core safety guarantee. Cannot be disabled.', locked: true },
    { key: 'fact', label: 'Block scheduling on failed fact-check', note: 'Posts with an unresolved flag stay in the approval queue.' },
    { key: 'notify', label: 'Notify me when posts need approval', note: 'Email + in-app when a draft enters the queue.' },
    { key: 'autoslot', label: 'Auto-assign approved posts to next open slot', note: 'Skips manual scheduling for approved content.' },
    { key: 'pause', label: 'Pause publishing on service degradation', note: 'Auto-hold all posts if Postiz or a worker goes down.' },
  ].map(it => {
    const on = safetyToggles[it.key];
    return {
      ...it,
      x: on ? '16px' : '0px',
      track: on ? v('grn') : v('chip'),
      lock: it.locked ? 'opacity:.7;cursor:not-allowed' : '',
    };
  });

  const IN = { p: 'in', pBg: '#0a66c2', pFg: '#fff' };
  const X = { p: 'X', pBg: theme === 'light' ? '#17202f' : '#e8edf6', pFg: theme === 'light' ? '#fff' : '#0a0e16' };
  const pf = (k: string) => k === 'in' ? IN : X;

  const setAccounts = [
    { ...pf('in'), name: 'Rubenius', handle: 'linkedin.com/company/rubenius', status: 'Connected', stC: v('grn') },
    { ...pf('X'), name: 'Rubenius', handle: '@rubenius', status: 'Connected', stC: v('grn') },
  ];

  const setServices = [
    { name: 'PostgreSQL', endpoint: 'db.internal:5432', status: 'Healthy', c: v('grn') },
    { name: 'SearXNG', endpoint: 'search.internal:8080', status: 'Healthy', c: v('grn') },
    { name: 'Postiz', endpoint: 'api.postiz.internal', status: 'Healthy', c: v('grn') },
    { name: 'Temporal', endpoint: 'temporal.internal:7233', status: 'Healthy', c: v('grn') },
    { name: 'Temporal UI', endpoint: 'temporal-ui.internal:8233', status: 'Healthy', c: v('grn') },
    { name: 'Worker', endpoint: 'worker-pool · 4 replicas', status: 'Degraded', c: v('amb') },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", alignItems: "flex-start", maxWidth: "1100px" }}>
      
      {/* Settings Navigation */}
      <div style={{ flex: "none", width: "172px", display: "flex", flexDirection: "column", gap: "2px", position: "sticky", top: 0 }}>
        {setNav.map((s, idx) => (
          <a key={idx} href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: "12.5px", padding: "7px 11px", borderRadius: "7px", color: s.fg, background: s.bg, fontWeight: s.w, textDecoration: "none" }}>{s.label}</a>
        ))}
      </div>

      {/* Main Settings Config Box */}
      <div style={{ flex: "1 1 480px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Publishing Plan */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontSize: "13.5px", fontWeight: 600 }}>Publishing plan</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12.5px", fontWeight: 500 }}>Posts per day</div>
                <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "1px" }}>Target volume across all platforms</div>
              </div>
              <div style={{ display: "flex", background: "var(--card2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
                {setPerDay.map(n => (
                  <span
                    key={n.v}
                    onClick={() => setPostsPerDay(n.v)}
                    style={{ font: "inherit", fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "6px", background: n.bg, color: n.fg, cursor: "pointer" }}
                  >
                    {n.v}
                  </span>
                ))}
              </div>
            </div>
            {setSlots.map((s, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 500 }}>{s.label} slot</div>
                  <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "1px" }}>{s.note}</div>
                </div>
                <span style={{ fontSize: "12.5px", fontFamily: "'IBM Plex Mono',monospace", padding: "6px 12px", border: "1px solid var(--line2)", borderRadius: "7px", color: "var(--text)" }}>{s.time}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12.5px", fontWeight: 500 }}>Timezone</div>
                <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "1px" }}>All slot times use this zone</div>
              </div>
              <span style={{ fontSize: "12.5px", fontFamily: "'IBM Plex Mono',monospace", padding: "6px 12px", border: "1px solid var(--line2)", borderRadius: "7px", color: "var(--text)" }}>IST · UTC+5:30</span>
            </div>
          </div>
        </section>

        {/* Approvals & safety */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontSize: "13.5px", fontWeight: 600 }}>Approvals &amp; safety</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {setToggles.map(t => (
              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 500 }}>{t.label}</div>
                  <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "1px", lineHeight: 1.45 }}>{t.note}</div>
                </div>
                <div onClick={() => toggleHandler(t.key, t.locked)} style={{ width: "38px", height: "22px", borderRadius: "12px", background: t.track, padding: "2px", cursor: t.locked ? "not-allowed" : "pointer", flex: "none", transition: "background .15s", opacity: t.locked ? 0.7 : 1 }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transform: `translateX(${t.x})`, transition: "transform .15s", boxShadow: "0 1px 2px rgba(0,0,0,.3)" }}></div>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", background: "var(--redbg)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--red)", flex: "none" }}></span>
              <div style={{ flex: 1, fontSize: "11.5px", color: "var(--red)", lineHeight: 1.45 }}>There is no &quot;publish without approval&quot; option by design. Every post passes a human gate before Postiz schedules it.</div>
            </div>
          </div>
        </section>

        {/* Connected accounts */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontSize: "13.5px", fontWeight: 600 }}>Connected accounts</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {setAccounts.map((a, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, width: "22px", height: "22px", borderRadius: "5px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: a.pBg, color: a.pFg, flex: "none" }}>{a.p}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--faint)" }}>{a.handle}</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: a.stC, whiteSpace: "nowrap" }}>● {a.status}</span>
                <button style={{ font: "inherit", fontSize: "11px", padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--line2)", background: "transparent", color: "var(--mut)", cursor: "pointer" }}>Manage</button>
              </div>
            ))}
            <button style={{ font: "inherit", fontSize: "12px", fontWeight: 600, margin: "13px 16px", padding: "8px 13px", borderRadius: "7px", border: "1px dashed var(--line2)", background: "transparent", color: "var(--acc)", cursor: "pointer", alignSelf: "flex-start" }}>+ Connect account</button>
          </div>
        </section>

        {/* Connected services */}
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontSize: "13.5px", fontWeight: 600 }}>Integrations</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {setServices.map((v, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", borderBottom: "1px solid var(--line)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: v.c, flex: "none" }}></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 500 }}>{v.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--faint)", fontFamily: "'IBM Plex Mono',monospace" }}>{v.endpoint}</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: v.c, whiteSpace: "nowrap" }}>{v.status}</span>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button style={{ font: "inherit", fontSize: "12.5px", fontWeight: 600, padding: "8px 16px", borderRadius: "7px", border: "none", background: "var(--acc)", color: "#08111f", cursor: "pointer" }}>Save changes</button>
          <button style={{ font: "inherit", fontSize: "12.5px", padding: "8px 14px", borderRadius: "7px", border: "1px solid var(--line2)", background: "transparent", color: "var(--mut)", cursor: "pointer" }}>Cancel</button>
          <div style={{ flex: 1 }}></div>
          <span style={{ fontSize: "11px", color: "var(--faint)" }}>Last saved 2h ago</span>
        </div>

      </div>

    </div>
  );
}
