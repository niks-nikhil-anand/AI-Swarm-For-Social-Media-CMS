"use client";
/* ============================================================
   SWARM — TemporalMonitor: durable workflow status for a run
   ============================================================ */
import { useState, useEffect } from "react";
import { Icon, Btn, StatusPill } from "./ui";

type MonitorStatus = "idle" | "working" | "done" | "error";

const WORKFLOW_TO_MONITOR: Record<string, MonitorStatus> = {
  RUNNING: "working",
  COMPLETED: "done",
  FAILED: "error",
  TERMINATED: "error",
  TIMED_OUT: "error",
  CANCELLED: "error",
};

export function TemporalMonitor({ projectId }: { projectId?: string }) {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [status, setStatus] = useState<MonitorStatus>("idle");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const temporalUiBase = process.env.NEXT_PUBLIC_TEMPORAL_UI_URL || "http://localhost:8080";

  // Hydrate on mount: a refresh must reconnect to an already-running
  // workflow instead of offering "Start research" again.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/projects/${projectId}/workflow/status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const mapped = WORKFLOW_TO_MONITOR[data.workflowStatus];
        if (mapped) {
          setWorkflowId(data.workflowId);
          setStatus(mapped);
        }
      })
      .catch(() => { /* Temporal unreachable — leave in idle state */ });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !workflowId || status === "done" || status === "error") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/workflow/status`);
        if (!res.ok) return;
        const data = await res.json();
        setStatus(WORKFLOW_TO_MONITOR[data.workflowStatus] ?? "working");
      } catch {
        // Temporal may be briefly unreachable; keep polling.
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [projectId, workflowId, status]);

  async function startWorkflow() {
    if (!projectId || starting) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/workflow`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start workflow");
      setWorkflowId(data.workflowId);
      setStatus("working");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start workflow");
      setStatus("error");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border-soft)", background: "var(--elevated)" }}>
      <span style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent-2)", flexShrink: 0 }}>
        <Icon name="zap" size={14} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>Temporal workflow</div>
        <div className="mono" style={{ fontSize: 10.5, color: error ? "var(--st-error)" : "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {error || workflowId || "Not started"}
        </div>
      </div>
      <StatusPill status={status} size="sm" />
      {workflowId ? (
        <Btn
          size="sm"
          icon="external-link"
          onClick={() => window.open(`${temporalUiBase}/namespaces/default/workflows/${workflowId}`, "_blank", "noopener")}
        >
          Temporal UI
        </Btn>
      ) : (
        <Btn size="sm" kind="primary" icon="play" onClick={startWorkflow} disabled={starting || !projectId}>
          {starting ? "Starting…" : "Start research"}
        </Btn>
      )}
    </div>
  );
}
