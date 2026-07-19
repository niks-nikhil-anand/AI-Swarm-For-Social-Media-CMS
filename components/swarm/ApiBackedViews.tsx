"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ApiState<T> = { data: T | null; loading: boolean; error: string | null };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Request failed: ${res.status}`);
  return (json?.data ?? json) as T;
}

function useApi<T>(path: string): ApiState<T> & { refresh: () => Promise<void> } {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null });
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      setState({ data: await api<T>(path), loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error instanceof Error ? error.message : String(error) });
    }
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    api<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error: error instanceof Error ? error.message : String(error) });
      });
    return () => { cancelled = true; };
  }, [path]);

  return { ...state, refresh };
}

function fmtDate(value?: string | Date | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function fmtNum(value?: number | null, suffix = "") {
  if (value == null) return "-";
  return `${Intl.NumberFormat().format(value)}${suffix}`;
}

function Shell({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 1240 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 650 }}>{title}</h2>
        <div style={{ flex: 1 }} />
        {action}
      </div>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, boxShadow: "var(--shadow)", overflow: "hidden" }}>{children}</section>;
}

function Empty({ label }: { label: string }) {
  return <div style={{ padding: 22, color: "var(--mut)", fontSize: 13 }}>{label}</div>;
}

function ErrorBox({ message }: { message: string }) {
  return <div style={{ padding: 12, border: "1px solid var(--red)", color: "var(--red)", background: "var(--redbg)", borderRadius: 8, fontSize: 12 }}>{message}</div>;
}

function Button({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ font: "inherit", fontSize: 12, fontWeight: 650, padding: "7px 11px", borderRadius: 7, border: "1px solid var(--line)", background: disabled ? "var(--chip)" : "var(--accbg)", color: disabled ? "var(--mut)" : "var(--acc)", cursor: disabled ? "default" : "pointer" }}>
      {children}
    </button>
  );
}

function Table<T>({ rows, columns, empty }: {
  rows: T[];
  empty: string;
  columns: Array<{ key: string; title: string; render: (row: T) => React.ReactNode; width?: string }>;
}) {
  if (rows.length === 0) return <Card><Empty label={empty} /></Card>;
  return (
    <Card>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>{columns.map((c) => <th key={c.key} style={{ width: c.width, textAlign: "left", padding: "10px 12px", color: "var(--mut)", borderBottom: "1px solid var(--line)", fontWeight: 650 }}>{c.title}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => <td key={c.key} style={{ padding: "11px 12px", borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>{c.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Badge({ children, tone = "mut" }: { children: React.ReactNode; tone?: "mut" | "acc" | "grn" | "amb" | "red" }) {
  return <span style={{ display: "inline-flex", padding: "2px 7px", borderRadius: 999, background: `var(--${tone}bg, var(--chip))`, color: `var(--${tone}, var(--mut))`, fontSize: 11, fontWeight: 650 }}>{children}</span>;
}

type Draft = {
  id: string; title: string; topic: string; status: string; qualityScore?: number | null; factStatus?: string | null; createdAt: string;
  campaign?: { name: string }; variants?: Array<{ id: string; platform: string; qualityScore?: number | null; factStatus?: string | null; body: string }>;
};

export function ContentQueueApiView() {
  const { data, loading, error, refresh } = useApi<Draft[]>("/api/content/drafts");
  return (
    <Shell title="Content Queue" action={<Button onClick={refresh}>Refresh</Button>}>
      {error && <ErrorBox message={error} />}
      <Table
        rows={data ?? []}
        empty={loading ? "Loading drafts..." : "No drafts yet. Create one from Research."}
        columns={[
          { key: "title", title: "Draft", render: (d) => <><strong>{d.title}</strong><div style={{ color: "var(--mut)", marginTop: 4 }}>{d.topic}</div></> },
          { key: "status", title: "Status", width: "120px", render: (d) => <Badge tone={d.status === "Approved" ? "grn" : d.status === "Rejected" ? "red" : "acc"}>{d.status}</Badge> },
          { key: "variants", title: "Variants", render: (d) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{(d.variants ?? []).map((v) => <Badge key={v.id}>{v.platform} · {v.qualityScore ?? "-"}%</Badge>)}</div> },
          { key: "created", title: "Created", width: "140px", render: (d) => fmtDate(d.createdAt) },
        ]}
      />
    </Shell>
  );
}

type Trend = { id: string; topic: string; title?: string | null; sourceName?: string | null; opportunityScore?: number | null; freshnessScore?: number | null; audienceRelevance?: number | null; supportingUrls: string[]; createdAt: string };

export function ResearchApiView() {
  const { data, loading, error, refresh } = useApi<Trend[]>("/api/trends");
  const runResearch = async () => {
    await api("/api/trends/run", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    await refresh();
  };
  return (
    <Shell title="Research" action={<><Button onClick={runResearch}>Run research</Button><Button onClick={refresh}>Refresh</Button></>}>
      {error && <ErrorBox message={error} />}
      <Table
        rows={data ?? []}
        empty={loading ? "Loading signals..." : "No trend signals yet."}
        columns={[
          { key: "topic", title: "Signal", render: (t) => <><strong>{t.title ?? t.topic}</strong><div style={{ color: "var(--mut)", marginTop: 4 }}>{t.sourceName ?? "Unknown source"} · {t.supportingUrls?.length ?? 0} URLs</div></> },
          { key: "score", title: "Scores", width: "220px", render: (t) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Badge tone="acc">Opp {t.opportunityScore ?? "-"}</Badge><Badge>Fresh {t.freshnessScore ?? "-"}</Badge><Badge>Audience {t.audienceRelevance ?? "-"}</Badge></div> },
          { key: "found", title: "Found", width: "140px", render: (t) => fmtDate(t.createdAt) },
        ]}
      />
    </Shell>
  );
}

type Approval = { id: string; status: string; message?: string | null; createdAt: string; variant: { platform: string; body: string; qualityScore?: number | null; factStatus?: string | null; draft: { title: string; topic: string } } };

export function ApprovalsApiView() {
  const { data, loading, error, refresh } = useApi<Approval[]>("/api/approvals");
  const decide = async (id: string, action: "approve" | "changes" | "reject") => {
    await api(`/api/approvals/${id}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ note: "Updated from dashboard." }) });
    await refresh();
  };
  return (
    <Shell title="Approvals" action={<Button onClick={refresh}>Refresh</Button>}>
      {error && <ErrorBox message={error} />}
      <Table
        rows={data ?? []}
        empty={loading ? "Loading approvals..." : "No approvals waiting."}
        columns={[
          { key: "post", title: "Post", render: (a) => <><strong>{a.variant.draft.title}</strong><div style={{ color: "var(--mut)", marginTop: 4, maxWidth: 520 }}>{a.variant.body.slice(0, 180)}</div></> },
          { key: "checks", title: "Checks", width: "180px", render: (a) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Badge>{a.variant.platform}</Badge><Badge tone="amb">Q {a.variant.qualityScore ?? "-"}</Badge><Badge>{a.variant.factStatus ?? "Unchecked"}</Badge></div> },
          { key: "actions", title: "Actions", width: "260px", render: (a) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Button onClick={() => decide(a.id, "approve")}>Approve</Button><Button onClick={() => decide(a.id, "changes")}>Changes</Button><Button onClick={() => decide(a.id, "reject")}>Reject</Button></div> },
        ]}
      />
    </Shell>
  );
}

type Schedule = { id: string; status: string; platform: string; scheduledFor: string; timezone: string; variant: { body: string; draft: { title: string } }; account?: { displayName: string } };

export function CalendarApiView() {
  const { data, loading, error, refresh } = useApi<Schedule[]>("/api/schedules");
  const grouped = useMemo(() => {
    return (data ?? []).reduce<Record<string, Schedule[]>>((acc, row) => {
      const key = new Date(row.scheduledFor).toDateString();
      acc[key] = [...(acc[key] ?? []), row];
      return acc;
    }, {});
  }, [data]);
  return (
    <Shell title="Calendar" action={<Button onClick={refresh}>Refresh</Button>}>
      {error && <ErrorBox message={error} />}
      {loading && !data ? <Card><Empty label="Loading schedule..." /></Card> : Object.keys(grouped).length === 0 ? <Card><Empty label="No scheduled posts." /></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          {Object.entries(grouped).map(([day, rows]) => <Card key={day}><div style={{ padding: 12, borderBottom: "1px solid var(--line)", fontWeight: 650 }}>{day}</div>{rows.map((s) => <div key={s.id} style={{ padding: 12, borderBottom: "1px solid var(--line)" }}><Badge tone={s.status === "Published" ? "grn" : "acc"}>{s.status}</Badge><div style={{ marginTop: 8, fontWeight: 600 }}>{fmtDate(s.scheduledFor)} · {s.platform}</div><div style={{ color: "var(--mut)", fontSize: 12, marginTop: 4 }}>{s.variant.draft.title}</div></div>)}</Card>)}
        </div>
      )}
    </Shell>
  );
}

type PublishedPost = { id: string; platform: string; publishedAt: string; platformPostId?: string | null; url?: string | null; schedule: { variant: { body: string; draft: { title: string } } }; metrics: Array<{ impressions?: number | null; likes?: number | null; comments?: number | null; engagementRate?: number | null }> };

export function PublishedPostsApiView() {
  const { data, loading, error, refresh } = useApi<PublishedPost[]>("/api/published-posts");
  return (
    <Shell title="Published Posts" action={<Button onClick={refresh}>Refresh</Button>}>
      {error && <ErrorBox message={error} />}
      <Table
        rows={data ?? []}
        empty={loading ? "Loading published posts..." : "No published posts yet."}
        columns={[
          { key: "post", title: "Post", render: (p) => <><strong>{p.schedule.variant.draft.title}</strong><div style={{ color: "var(--mut)", marginTop: 4 }}>{p.schedule.variant.body.slice(0, 160)}</div></> },
          { key: "platform", title: "Platform", width: "110px", render: (p) => <Badge>{p.platform}</Badge> },
          { key: "metrics", title: "Latest metrics", width: "220px", render: (p) => { const m = p.metrics?.[0]; return <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Badge>Imp {fmtNum(m?.impressions)}</Badge><Badge>Likes {fmtNum(m?.likes)}</Badge><Badge>Eng {fmtNum(m?.engagementRate, "%")}</Badge></div>; } },
          { key: "at", title: "Published", width: "140px", render: (p) => fmtDate(p.publishedAt) },
        ]}
      />
    </Shell>
  );
}

type Analytics = { totals: Record<string, number>; averages: Record<string, number | null>; operations: { approvalBacklog: number; queuedSchedules: number }; topPosts: Array<{ id: string; platform: string; title: string; metric?: { impressions?: number | null; engagementRate?: number | null } | null }> };

export function AnalyticsApiView() {
  const { data, loading, error, refresh } = useApi<Analytics>("/api/analytics");
  const stats = data ? [
    ["Posts", data.totals.posts],
    ["Impressions", data.totals.impressions],
    ["Likes", data.totals.likes],
    ["Link clicks", data.totals.linkClicks],
    ["Approval backlog", data.operations.approvalBacklog],
    ["Queued schedules", data.operations.queuedSchedules],
  ] : [];
  return (
    <Shell title="Analytics" action={<Button onClick={refresh}>Refresh</Button>}>
      {error && <ErrorBox message={error} />}
      {loading && !data ? <Card><Empty label="Loading analytics..." /></Card> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>{stats.map(([label, value]) => <Card key={label}><div style={{ padding: 14 }}><div style={{ color: "var(--mut)", fontSize: 11 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{fmtNum(value as number)}</div></div></Card>)}</div>
          <Table rows={data?.topPosts ?? []} empty="No analytics yet." columns={[{ key: "title", title: "Top posts", render: (p) => <><strong>{p.title}</strong><div style={{ color: "var(--mut)", marginTop: 4 }}>{p.platform}</div></> }, { key: "metric", title: "Performance", width: "220px", render: (p) => <div style={{ display: "flex", gap: 6 }}><Badge>Imp {fmtNum(p.metric?.impressions)}</Badge><Badge>Eng {fmtNum(p.metric?.engagementRate, "%")}</Badge></div> }]} />
        </>
      )}
    </Shell>
  );
}

type Source = { id: string; name: string; type: string; query?: string | null; keywords: string[]; isActive: boolean; createdAt: string };

export function SourcesApiView() {
  const { data, loading, error, refresh } = useApi<Source[]>("/api/sources");
  const seed = async () => {
    await api("/api/sources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "AI social media trends", type: "SearXNG", query: "AI social media automation trends", keywords: ["AI agents", "social media automation"] }) });
    await refresh();
  };
  return (
    <Shell title="Sources" action={<><Button onClick={seed}>Add starter source</Button><Button onClick={refresh}>Refresh</Button></>}>
      {error && <ErrorBox message={error} />}
      <Table rows={data ?? []} empty={loading ? "Loading sources..." : "No sources configured."} columns={[{ key: "name", title: "Source", render: (s) => <><strong>{s.name}</strong><div style={{ color: "var(--mut)", marginTop: 4 }}>{s.query ?? s.keywords.join(", ")}</div></> }, { key: "type", title: "Type", width: "120px", render: (s) => <Badge>{s.type}</Badge> }, { key: "active", title: "State", width: "100px", render: (s) => <Badge tone={s.isActive ? "grn" : "mut"}>{s.isActive ? "Active" : "Paused"}</Badge> }]} />
    </Shell>
  );
}

type HealthResponse = { overall: string; checkedAt: string; checks: Array<{ service: string; status: string; latencyMs: number; message?: string | null }> };

export function WorkflowsApiView() {
  const { data, loading, error, refresh } = useApi<HealthResponse>("/api/health");
  return (
    <Shell title="Workflows" action={<><a href={process.env.NEXT_PUBLIC_TEMPORAL_UI_URL || "http://localhost:8080"} target="_blank" style={{ fontSize: 12 }}>Temporal UI</a><Button onClick={refresh}>Run health check</Button></>}>
      {error && <ErrorBox message={error} />}
      <Card><div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}><Badge tone={data?.overall === "Healthy" ? "grn" : "amb"}>{data?.overall ?? (loading ? "Checking" : "Unknown")}</Badge><span style={{ color: "var(--mut)", fontSize: 12 }}>Last checked {fmtDate(data?.checkedAt)}</span></div></Card>
      <Table rows={data?.checks ?? []} empty="No health checks yet." columns={[{ key: "service", title: "Service", render: (h) => <strong>{h.service}</strong> }, { key: "status", title: "Status", width: "130px", render: (h) => <Badge tone={h.status === "Healthy" ? "grn" : h.status === "Down" ? "red" : "amb"}>{h.status}</Badge> }, { key: "latency", title: "Latency", width: "110px", render: (h) => `${h.latencyMs} ms` }, { key: "message", title: "Message", render: (h) => <span style={{ color: "var(--mut)" }}>{h.message ?? "OK"}</span> }]} />
    </Shell>
  );
}

type Campaign = { id: string; name: string; timezone: string; targetPostsPerDay: number; approvalRequired: boolean; isPaused: boolean; platforms: string[] };
type Account = { id: string; platform: string; displayName: string; handle?: string | null; isActive: boolean };

export function SettingsApiView() {
  const campaigns = useApi<Campaign[]>("/api/campaigns");
  const accounts = useApi<Account[]>("/api/platform-accounts");
  const sync = async () => {
    await api("/api/platform-accounts/sync", { method: "POST" });
    await accounts.refresh();
  };
  return (
    <Shell title="Settings" action={<Button onClick={sync}>Sync Postiz accounts</Button>}>
      {(campaigns.error || accounts.error) && <ErrorBox message={campaigns.error ?? accounts.error ?? ""} />}
      <Table rows={campaigns.data ?? []} empty={campaigns.loading ? "Loading campaigns..." : "No campaigns configured."} columns={[{ key: "name", title: "Campaign", render: (c) => <><strong>{c.name}</strong><div style={{ color: "var(--mut)", marginTop: 4 }}>{c.timezone} · {c.targetPostsPerDay}/day</div></> }, { key: "platforms", title: "Platforms", render: (c) => <div style={{ display: "flex", gap: 6 }}>{c.platforms.map((p) => <Badge key={p}>{p}</Badge>)}</div> }, { key: "rules", title: "Rules", render: (c) => <div style={{ display: "flex", gap: 6 }}><Badge tone={c.approvalRequired ? "grn" : "amb"}>{c.approvalRequired ? "Approval required" : "Auto approval"}</Badge><Badge tone={c.isPaused ? "red" : "grn"}>{c.isPaused ? "Paused" : "Publishing on"}</Badge></div> }]} />
      <Table rows={accounts.data ?? []} empty={accounts.loading ? "Loading accounts..." : "No Postiz accounts connected."} columns={[{ key: "account", title: "Connected accounts", render: (a) => <><strong>{a.displayName}</strong><div style={{ color: "var(--mut)", marginTop: 4 }}>{a.handle ?? "No handle"}</div></> }, { key: "platform", title: "Platform", width: "120px", render: (a) => <Badge>{a.platform}</Badge> }, { key: "state", title: "State", width: "100px", render: (a) => <Badge tone={a.isActive ? "grn" : "mut"}>{a.isActive ? "Active" : "Inactive"}</Badge> }]} />
    </Shell>
  );
}
