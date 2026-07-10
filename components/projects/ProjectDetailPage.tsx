"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Btn, Card, Icon, IconBtn, StatusDot } from "../swarm/ui";
import { Sidebar, TopBar } from "../swarm/Shell";
import { AgentGraph } from "../swarm/Graph";
import { Slide } from "../swarm/Output";
import type { Agent, AgentStatus, Slide as SlideT } from "../swarm/data";

type ProjectStatus = "Draft" | "Running" | "Complete" | "Failed";
type Tab = "overview" | "replay" | "agents" | "activity" | "sources" | "slides";

interface AgentRecord {
  id: string; slug: string; name: string; short: string; icon: string; accent: string;
  role: string; why: string; deps: string[]; layer: number; status: string; progress: number;
  startedAt: string | null; completedAt: string | null;
}
interface TimelineRecord {
  id: string; type: string; text: string; url: string | null; topic: string | null; createdAt: string;
  agent: { name: string; slug: string; accent: string };
}
interface SearchRecord {
  id: string; query: string; rank: number; title: string; url: string; snippet: string | null;
  engine: string | null; retrievedAt: string;
}
interface EvidenceRecord {
  id: string; content: string; topic: string; sourceUrl: string; sourceTitle: string | null;
  verified: boolean; verifiedBy: string | null; createdAt: string; agent: { name: string; slug: string };
}
interface ProjectDetail {
  id: string; title: string; goal: string; format: string; status: ProjectStatus;
  tokensIn: number; tokensOut: number; searches: number; durationSeconds: number | null;
  wordCount: number | null; summary: string | null; createdAt: string; completedAt: string | null;
  agents: AgentRecord[]; sources: { id: string; host: string; title: string; by: string; verified: boolean }[];
  slides: { id: string; n: number; title: string; sub: string | null; kind: string }[];
  timeline: TimelineRecord[]; searchResults: SearchRecord[]; evidence: EvidenceRecord[];
}

const ROUTES: Record<string, string> = { settings: "/settings", dashboard: "/dashboard", history: "/projects", skills: "/skills" };
const FORMAT_LABELS: Record<string, string> = { deck: "PowerPoint", pptx: "PowerPoint", pdf: "PDF report", docx: "Word document", blog: "Blog post", markdown: "Markdown", summary: "Executive summary" };
const STATUS: Record<ProjectStatus, { label: string; dot: string; color: string }> = {
  Draft: { label: "Draft", dot: "idle", color: "var(--muted)" },
  Running: { label: "Running", dot: "working", color: "var(--st-working)" },
  Complete: { label: "Complete", dot: "done", color: "var(--st-done)" },
  Failed: { label: "Failed", dot: "error", color: "var(--st-error)" },
};
const AGENT_STATUS: Record<string, { label: string; dot: string; color: string }> = {
  Idle: { label: "Waiting", dot: "idle", color: "var(--muted)" },
  Waiting: { label: "Waiting", dot: "idle", color: "var(--muted)" },
  Working: { label: "Working", dot: "working", color: "var(--st-working)" },
  Blocked: { label: "Blocked", dot: "blocked", color: "var(--st-blocked)" },
  Done: { label: "Done", dot: "done", color: "var(--st-done)" },
  Error: { label: "Error", dot: "error", color: "var(--st-error)" },
};
const EVENT_META: Record<string, { icon: string; color: string }> = {
  Thought: { icon: "discussion-circle", color: "var(--muted)" },
  Search: { icon: "search", color: "var(--accent-2)" },
  Url: { icon: "globe", color: "var(--st-working)" },
  Note: { icon: "file-text", color: "var(--st-done)" },
  Handoff: { icon: "git-branch", color: "var(--purple)" },
  System: { icon: "zap", color: "var(--faint)" },
  Warn: { icon: "alert-triangle", color: "var(--st-blocked)" },
  Error: { icon: "alert-circle", color: "var(--st-error)" },
};

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
function formatDate(value: string) {
  return new Date(value).toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
function Meta({ label, children }: { label: string; children: ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "8px 0", fontSize: 12.5 }}><span className="muted">{label}</span><span style={{ color: "var(--text)", textAlign: "right" }}>{children}</span></div>;
}
function EmptyTab({ icon, title, body }: { icon: string; title: string; body: string }) {
  return <Card style={{ padding: 42, textAlign: "center" }}><Icon name={icon} size={24} color="var(--faint)" /><h3 className="h4" style={{ marginTop: 12 }}>{title}</h3><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{body}</p></Card>;
}

export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
        if (!response.ok) throw new Error(response.status === 404 ? "Project not found" : "Could not load this project");
        const data: ProjectDetail = await response.json();
        if (cancelled) return;
        setProject(data);
        setError(null);
        setLoading(false);
        if (data.status === "Running") timer = setTimeout(load, 3000);
      } catch (caught) {
        if (!cancelled) { setError(caught instanceof Error ? caught.message : "Could not load this project"); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [projectId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const openProject = (id: string) => router.push(`/projects/${id}`);
  const go = (view: string) => router.push(ROUTES[view] || "/");
  const shell = (content: ReactNode, title = "Project") => (
    <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
      <Sidebar view="session" activeSession={projectId} onNew={() => router.push("/")} onGo={({ view }) => go(view)} onOpenSession={openProject} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar stages={null} stage="project" reached={[]} onJump={() => {}} status={null} title={title} theme={theme} onTheme={() => setTheme((value) => value === "dark" ? "light" : "dark")} />
        {content}
      </main>
    </div>
  );

  if (loading) return shell(<div style={{ flex: 1, display: "grid", placeItems: "center" }}><span className="muted">Loading project…</span></div>);
  if (error || !project) return shell(<div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}><Card style={{ padding: 32, textAlign: "center", maxWidth: 420 }}><Icon name="alert-circle" size={24} color="var(--st-error)" /><h2 className="h3" style={{ marginTop: 12 }}>{error || "Project not found"}</h2><div style={{ marginTop: 18 }}><Btn kind="primary" icon="arrow-left" onClick={() => router.push("/projects")}>Back to projects</Btn></div></Card></div>);

  const status = STATUS[project.status];
  const completedAgents = project.agents.filter((agent) => agent.status === "Done").length;
  const overall = project.agents.length ? Math.round(project.agents.reduce((sum, agent) => sum + agent.progress, 0) / project.agents.length) : 0;
  const format = FORMAT_LABELS[project.format] || project.format;

  const overview = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {project.status === "Running" && <Card style={{ padding: 20, borderColor: "var(--accent-line)" }}><div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", background: "var(--accent-soft)", color: "var(--accent)" }}><Icon name="activity" size={20} /></span><div style={{ flex: 1 }}><div className="h4">Research is in progress</div><div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>{completedAgents} of {project.agents.length} agents complete · {overall}% overall</div></div><Btn kind="primary" icon="activity" onClick={() => router.push("/")}>Open live run</Btn></div></Card>}
      {project.status === "Failed" && <Card style={{ padding: 20, borderColor: "color-mix(in oklab, var(--st-error) 35%, transparent)" }}><div style={{ display: "flex", gap: 12 }}><Icon name="alert-circle" size={20} color="var(--st-error)" /><div><div className="h4">This run failed</div><p className="muted" style={{ fontSize: 13, marginTop: 5 }}>Completed research has been preserved. Open the Agents or Activity tab to locate the failed step.</p></div></div></Card>}
      <Card style={{ padding: 22 }}>
        <div className="eyebrow">Executive summary</div>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginTop: 12 }}>{project.summary || (project.status === "Complete" ? "The workflow completed without a stored executive summary." : "A summary will appear after synthesis completes.")}</p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          ["Agents", `${completedAgents}/${project.agents.length}`, "users"],
          ["Research searches", project.searches.toLocaleString(), "search"],
          ["Tokens", (project.tokensIn + project.tokensOut).toLocaleString(), "zap"],
          ["Evidence", project.evidence.length.toLocaleString(), "shield"],
        ].map(([label, value, icon]) => <Card key={label} style={{ padding: 16 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><span className="eyebrow">{label}</span><Icon name={icon} size={14} color="var(--faint)" /></div><div className="tabular" style={{ fontSize: 25, fontWeight: 700, marginTop: 10 }}>{value}</div></Card>)}
      </div>
      <Card style={{ padding: 20 }}><div className="h4" style={{ marginBottom: 14 }}>Latest activity</div>{project.timeline.length ? project.timeline.slice(0, 5).map((event) => <TimelineItem key={event.id} event={event} />) : <p className="muted" style={{ fontSize: 13 }}>No activity has been recorded.</p>}</Card>
    </div>
  );

  const agents = project.agents.length ? (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
      {project.agents.map((agent) => {
        const meta = AGENT_STATUS[agent.status] || AGENT_STATUS.Idle;
        return <Card key={agent.id} style={{ padding: 18 }}><div style={{ display: "flex", gap: 12 }}><span style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--elevated)", color: agent.accent }}><Icon name={agent.icon} size={18} /></span><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</span><span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, color: meta.color, fontSize: 11.5, fontWeight: 600 }}><StatusDot status={meta.dot} size={6} />{meta.label}</span></div><div className="faint" style={{ fontSize: 11, marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{agent.role}</div></div></div><p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: 14, minHeight: 40 }}>{agent.why}</p><div style={{ height: 5, background: "var(--elevated)", borderRadius: 99, overflow: "hidden", marginTop: 14 }}><div style={{ height: "100%", width: `${agent.progress}%`, background: meta.color, borderRadius: 99 }} /></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}><span className="faint">{agent.startedAt ? `Started ${formatDate(agent.startedAt)}` : "Not started"}</span><span className="mono">{Math.round(agent.progress)}%</span></div></Card>;
      })}
    </div>
  ) : <EmptyTab icon="users" title="No agent snapshot" body="This project does not contain a persisted agent team." />;

  const activity = project.timeline.length ? <Card style={{ padding: "4px 20px" }}>{project.timeline.map((event) => <TimelineItem key={event.id} event={event} />)}</Card> : <EmptyTab icon="activity" title="No activity yet" body="Agent events will appear here when the workflow starts." />;

  const sources = project.searchResults.length ? <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{project.searchResults.map((source) => <Card key={source.id} style={{ padding: 16 }}><div style={{ display: "flex", gap: 12 }}><span style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: "var(--elevated)", color: "var(--accent-2)", flexShrink: 0 }}><Icon name="globe" size={15} /></span><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><a href={source.url} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{source.title}</a><Badge tone="neutral">#{source.rank}</Badge>{source.engine && <Badge tone="cyan">{source.engine}</Badge>}</div><div className="mono" style={{ fontSize: 10.5, color: "var(--accent-2)", marginTop: 4 }}>{hostOf(source.url)}</div>{source.snippet && <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>{source.snippet}</p>}<div className="faint" style={{ fontSize: 10.5, marginTop: 8 }}>Query: {source.query} · retrieved {formatDate(source.retrievedAt)}</div></div><IconBtn name="external-link" size={30} title="Open source" onClick={() => window.open(source.url, "_blank", "noopener,noreferrer")} /></div></Card>)}</div> : <EmptyTab icon="globe" title="No research sources" body="SearXNG results will appear here after a research agent performs a search." />;

  const replay = <ReplayPanel project={project} />;

  const slides = project.slides && project.slides.length > 0 ? (
    <SlidesViewer slides={project.slides as SlideT[]} />
  ) : (
    <EmptyTab icon="layers" title="No slides generated" body="Slides will appear here after the Presentation Designer finishes." />
  );

  return shell(
    <>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Btn kind="ghost" size="sm" icon="arrow-left" onClick={() => router.push("/projects")}>Projects</Btn>
        <div style={{ width: 1, height: 28, background: "var(--border)" }} />
        <span style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--accent-soft)", color: "var(--accent)" }}><Icon name="layers" size={17} /></span>
        <div style={{ minWidth: 0 }}><h1 style={{ fontSize: 16, fontWeight: 650, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 520 }}>{project.title}</h1><div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{format} · {formatDate(project.createdAt)}</div></div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: status.color, fontSize: 12, fontWeight: 600 }}><StatusDot status={status.dot} size={7} />{status.label}</span>
        <div style={{ flex: 1 }} />
        {project.status === "Running" && <Btn kind="primary" icon="activity" onClick={() => router.push("/")}>Open live run</Btn>}
        {project.status !== "Running" && project.timeline.length > 0 && <Btn kind="secondary" icon="play" onClick={() => setTab("replay")}>Replay run</Btn>}
        {project.status === "Failed" && <Btn kind="primary" icon="reload" onClick={() => router.push("/")}>Retry from setup</Btn>}
        {project.status === "Complete" && (
          <>
            <Btn kind="primary" icon="eye" onClick={() => setTab("slides")}>View output</Btn>
            <Btn kind="secondary" icon="duplicate" onClick={() => router.push("/")}>Clone &amp; rerun</Btn>
          </>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: "24px" }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid var(--border)" }}>{(["overview", "slides", "replay", "agents", "activity", "sources"] as Tab[]).map((value) => <button key={value} onClick={() => setTab(value)} style={{ padding: "10px 14px", border: "none", borderBottom: tab === value ? "2px solid var(--accent)" : "2px solid transparent", background: "transparent", color: tab === value ? "var(--text)" : "var(--muted)", fontFamily: "var(--font)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{value}{value === "agents" ? ` (${project.agents.length})` : value === "activity" ? ` (${project.timeline.length})` : value === "sources" ? ` (${project.searchResults.length})` : value === "slides" ? ` (${project.slides?.length || 0})` : ""}</button>)}</div>
            {tab === "overview" ? overview : tab === "slides" ? slides : tab === "replay" ? replay : tab === "agents" ? agents : tab === "activity" ? activity : sources}
          </div>
        </div>
        <aside style={{ width: 300, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--surface)", overflow: "auto", padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Goal</div><p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-2)" }}>{project.goal}</p>
          <div style={{ height: 1, background: "var(--border)", margin: "20px 0 12px" }} />
          <div className="eyebrow" style={{ marginBottom: 5 }}>Project details</div>
          <Meta label="Format">{format}</Meta><Meta label="Status">{status.label}</Meta><Meta label="Run time"><span className="mono">{formatDuration(project.durationSeconds)}</span></Meta><Meta label="Words">{project.wordCount?.toLocaleString() || "—"}</Meta><Meta label="Created">{formatDate(project.createdAt)}</Meta><Meta label="Completed">{project.completedAt ? formatDate(project.completedAt) : "—"}</Meta>
          <div style={{ height: 1, background: "var(--border)", margin: "14px 0 12px" }} />
          <div className="eyebrow" style={{ marginBottom: 5 }}>Usage</div><Meta label="Input tokens"><span className="mono">{project.tokensIn.toLocaleString()}</span></Meta><Meta label="Output tokens"><span className="mono">{project.tokensOut.toLocaleString()}</span></Meta><Meta label="Web searches"><span className="mono">{project.searches}</span></Meta>
        </aside>
      </div>
    </>, project.title
  );
}

function TimelineItem({ event }: { event: TimelineRecord }) {
  const meta = EVENT_META[event.type] || EVENT_META.System;
  return <div style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--border-soft)" }}><span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--elevated)", color: meta.color, flexShrink: 0 }}><Icon name={meta.icon} size={13} /></span><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: event.agent?.accent || "var(--text-2)" }}>{event.agent?.name || "System"}</span><Badge tone="neutral">{event.type}</Badge><span className="faint mono" style={{ fontSize: 10.5, marginLeft: "auto" }}>{formatDate(event.createdAt)}</span></div><p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 6 }}>{event.text}</p>{event.url && <a href={event.url} target="_blank" rel="noreferrer" className="mono" style={{ display: "inline-block", color: "var(--accent-2)", fontSize: 10.5, marginTop: 5 }}>{hostOf(event.url)} ↗</a>}</div></div>;
}

function replayTime(seconds: number) {
  const value = Math.max(0, Math.round(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function ReplayPanel({ project }: { project: ProjectDetail }) {
  const startMs = new Date(project.createdAt).getTime();
  const lastEventMs = project.timeline.reduce((latest, event) => Math.max(latest, new Date(event.createdAt).getTime()), startMs);
  const lastAgentMs = project.agents.reduce((latest, agent) => Math.max(latest, agent.completedAt ? new Date(agent.completedAt).getTime() : 0), startMs);
  const hasReplaySignals = project.timeline.length > 0 || project.agents.some((agent) => agent.startedAt || agent.completedAt);
  const fallbackEndMs = project.completedAt ? new Date(project.completedAt).getTime() : startMs;
  const endMs = hasReplaySignals ? Math.max(lastEventMs, lastAgentMs) : fallbackEndMs;
  const duration = Math.max(1, Math.round((endMs - startMs) / 1000));
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setCursor((value) => {
        const next = Math.min(duration, value + 0.1 * speed);
        if (next >= duration) setPlaying(false);
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [playing, speed, duration]);

  if (project.timeline.length === 0 && project.agents.every((agent) => !agent.startedAt)) {
    return <EmptyTab icon="history" title="Replay unavailable" body="This project has no persisted activity or agent timing information." />;
  }

  const cursorMs = startMs + cursor * 1000;
  const agents: Agent[] = project.agents.map((agent) => ({
    id: agent.slug || agent.id, name: agent.name, short: agent.short, icon: agent.icon,
    accent: agent.accent, role: agent.role, why: agent.why, deps: agent.deps, layer: agent.layer,
  }));
  const statuses: Record<string, AgentStatus> = {};
  const progress: Record<string, number> = {};

  for (const agent of project.agents) {
    const key = agent.slug || agent.id;
    const agentStart = agent.startedAt ? new Date(agent.startedAt).getTime() : null;
    const agentEnd = agent.completedAt ? new Date(agent.completedAt).getTime() : null;
    if (!agentStart || cursorMs < agentStart) {
      statuses[key] = "idle"; progress[key] = 0; continue;
    }
    if (agentEnd && cursorMs >= agentEnd) {
      statuses[key] = "done"; progress[key] = 100; continue;
    }
    if (agent.status === "Error" && cursor >= duration) {
      statuses[key] = "error"; progress[key] = Math.max(10, Math.round(agent.progress)); continue;
    }
    statuses[key] = "working";
    const estimatedEnd = agentEnd || endMs;
    const span = Math.max(1, estimatedEnd - agentStart);
    progress[key] = Math.min(95, Math.max(5, Math.round(((cursorMs - agentStart) / span) * 100)));
  }

  const flows: { from: string; to: string }[] = [];
  agents.forEach((agent) => agent.deps.forEach((dependency) => {
    if (statuses[agent.id] === "working" && ["working", "done"].includes(statuses[dependency])) flows.push({ from: dependency, to: agent.id });
  }));
  const visibleEvents = [...project.timeline]
    .filter((event) => new Date(event.createdAt).getTime() <= cursorMs)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const activeCount = Object.values(statuses).filter((status) => status === "working").length;
  const doneCount = Object.values(statuses).filter((status) => status === "done").length;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Btn kind={playing ? "secondary" : "primary"} size="sm" icon={playing ? "pause" : "play"} onClick={() => { if (cursor >= duration) setCursor(0); setPlaying(!playing); }}>{playing ? "Pause" : cursor >= duration ? "Replay again" : "Play replay"}</Btn>
        <IconBtn name="reload" size={32} title="Restart replay" onClick={() => { setPlaying(false); setCursor(0); }} />
        <div style={{ display: "flex", gap: 3, padding: 3, borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)" }}>{[1, 2, 4, 8].map((value) => <button key={value} onClick={() => setSpeed(value)} style={{ height: 26, minWidth: 34, padding: "0 8px", border: "none", borderRadius: 6, background: speed === value ? "var(--accent-soft)" : "transparent", color: speed === value ? "var(--accent-2)" : "var(--muted)", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer" }}>{value}×</button>)}</div>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, color: activeCount ? "var(--st-working)" : "var(--muted)", fontSize: 12 }}><StatusDot status={activeCount ? "working" : doneCount ? "done" : "idle"} size={6} />{activeCount} active · {doneCount} done</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-2)", minWidth: 82, textAlign: "right" }}>{replayTime(cursor)} / {replayTime(duration)}</span>
        <input aria-label="Replay position" type="range" min={0} max={duration} step={0.1} value={cursor} onChange={(event) => { setPlaying(false); setCursor(Number(event.target.value)); }} style={{ width: "100%", accentColor: "var(--accent)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(300px, .85fr)", minHeight: 560 }}>
        <div style={{ position: "relative", minHeight: 560, background: "var(--bg-2)", borderRight: "1px solid var(--border)" }}>
          <div style={{ position: "absolute", zIndex: 4, top: 12, left: 12, display: "flex", gap: 7 }}><Badge tone="cyan" icon="activity">Historical replay</Badge><Badge tone="neutral">{project.agents.length} agents</Badge></div>
          <AgentGraph agents={agents} statuses={statuses} progress={progress} layout="layered" flows={flows} selected={selected} onSelect={(agent) => setSelected(agent.id)} />
        </div>
        <div style={{ minHeight: 0, maxHeight: 560, overflow: "auto", background: "var(--surface)" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 2, padding: "13px 14px", display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}><Icon name="activity" size={14} color="var(--accent)" /><span className="h4">Replay activity</span><Badge tone="neutral">{visibleEvents.length}</Badge></div>
          {visibleEvents.length ? visibleEvents.map((event) => <ReplayEvent key={event.id} event={event} startMs={startMs} />) : <div style={{ padding: 40, textAlign: "center" }}><p className="muted" style={{ fontSize: 12.5 }}>Press play to replay the first signal.</p></div>}
        </div>
      </div>
    </Card>
  );
}

function ReplayEvent({ event, startMs }: { event: TimelineRecord; startMs: number }) {
  const meta = EVENT_META[event.type] || EVENT_META.System;
  const elapsed = Math.max(0, (new Date(event.createdAt).getTime() - startMs) / 1000);
  return <div style={{ display: "flex", gap: 10, padding: "11px 14px", borderBottom: "1px solid var(--border-soft)" }}><span style={{ width: 25, height: 25, borderRadius: 7, display: "grid", placeItems: "center", background: "var(--elevated)", color: meta.color, flexShrink: 0 }}><Icon name={meta.icon} size={12} /></span><div style={{ minWidth: 0, flex: 1 }}><div style={{ display: "flex", gap: 7, alignItems: "center" }}><span style={{ fontSize: 11.5, fontWeight: 600, color: event.agent?.accent || "var(--text-2)" }}>{event.agent?.name || "System"}</span><span className="mono faint" style={{ fontSize: 9.5, marginLeft: "auto" }}>+{replayTime(elapsed)}</span></div><p style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.45, marginTop: 4 }}>{event.text}</p></div></div>;
}

function SlidesViewer({ slides }: { slides: SlideT[] }) {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      <Card style={{ width: "100%", padding: 0, overflow: "hidden" }}>
        <div style={{ background: "var(--bg-2)", padding: "24px", display: "flex", justifyContent: "center", minHeight: 500 }}>
          {slide ? <Slide s={slide} scale={0.68} /> : <div className="muted">No slide available</div>}
        </div>
      </Card>
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", justifyContent: "center" }}>
        <Btn kind="secondary" size="sm" icon="chevron-left" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} />
        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 80, textAlign: "center" }}>Slide {idx + 1} of {slides.length}</span>
        <Btn kind="secondary" size="sm" icon="chevron-right" onClick={() => setIdx(Math.min(slides.length - 1, idx + 1))} disabled={idx === slides.length - 1} />
      </div>
    </div>
  );
}
