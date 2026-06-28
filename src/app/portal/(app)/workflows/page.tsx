"use client";

import { useState } from "react";
import { Activity, CheckCircle2, XCircle, Clock, Play, Pause, RotateCcw, StopCircle, AlertTriangle } from "lucide-react";

type WorkflowStatus = "Active" | "Paused" | "Failed" | "Completed";

interface Workflow {
  id: string;
  name: string;
  digitalEmployee: string;
  status: WorkflowStatus;
  lastRun: string;
  successRate: number;
  totalRuns: number;
  failedRuns: number;
  avgDuration: string;
  lastResult: string;
}

const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: "wf-001",
    name: "New Employee Welcome Sequence",
    digitalEmployee: "AI Onboarding Assistant",
    status: "Active",
    lastRun: "2024-11-18T09:30:00Z",
    successRate: 97,
    totalRuns: 34,
    failedRuns: 1,
    avgDuration: "2m 14s",
    lastResult: "Welcome email sent to Sarah Mitchell",
  },
  {
    id: "wf-002",
    name: "Document Chase Reminder",
    digitalEmployee: "AI Onboarding Assistant",
    status: "Active",
    lastRun: "2024-11-18T08:00:00Z",
    successRate: 100,
    totalRuns: 28,
    failedRuns: 0,
    avgDuration: "45s",
    lastResult: "3 reminders sent successfully",
  },
  {
    id: "wf-003",
    name: "High Risk Escalation",
    digitalEmployee: "AI Onboarding Assistant",
    status: "Failed",
    lastRun: "2024-11-17T16:45:00Z",
    successRate: 83,
    totalRuns: 6,
    failedRuns: 1,
    avgDuration: "1m 02s",
    lastResult: "Error: Manager email address not found for Jake Thompson",
  },
  {
    id: "wf-004",
    name: "Weekly Performance Report",
    digitalEmployee: "AI Admin Assistant",
    status: "Active",
    lastRun: "2024-11-18T07:00:00Z",
    successRate: 100,
    totalRuns: 12,
    failedRuns: 0,
    avgDuration: "5m 38s",
    lastResult: "Report generated and emailed to admin",
  },
  {
    id: "wf-005",
    name: "Daily Activity Digest",
    digitalEmployee: "AI Admin Assistant",
    status: "Paused",
    lastRun: "2024-11-15T18:00:00Z",
    successRate: 92,
    totalRuns: 45,
    failedRuns: 4,
    avgDuration: "1m 55s",
    lastResult: "Paused by admin on 15 Nov",
  },
  {
    id: "wf-006",
    name: "Lead Follow-Up Sequence",
    digitalEmployee: "AI Growth Assistant",
    status: "Active",
    lastRun: "2024-11-18T10:15:00Z",
    successRate: 95,
    totalRuns: 22,
    failedRuns: 1,
    avgDuration: "3m 10s",
    lastResult: "Follow-up sent to Sunrise Logistics",
  },
  {
    id: "wf-007",
    name: "Sales Pipeline Update",
    digitalEmployee: "AI Growth Assistant",
    status: "Active",
    lastRun: "2024-11-18T09:00:00Z",
    successRate: 98,
    totalRuns: 18,
    failedRuns: 0,
    avgDuration: "2m 30s",
    lastResult: "5 pipeline stages updated successfully",
  },
];

function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLOUR: Record<WorkflowStatus, string> = {
  Active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Paused: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Failed: "text-red-400 bg-red-500/10 border-red-500/20",
  Completed: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
};

const STATUS_ICON: Record<WorkflowStatus, React.FC<{ size?: number; className?: string }>> = {
  Active: CheckCircle2,
  Paused: Pause,
  Failed: XCircle,
  Completed: CheckCircle2,
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);
  const [toast, setToast] = useState<string | null>(null);

  function action(id: string, act: "pause" | "resume" | "retry" | "cancel") {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (act === "pause") return { ...w, status: "Paused" };
        if (act === "resume") return { ...w, status: "Active" };
        if (act === "retry") return { ...w, status: "Active", failedRuns: w.failedRuns, lastResult: "Retrying…" };
        if (act === "cancel") return { ...w, status: "Paused" };
        return w;
      })
    );
    const labels = { pause: "Workflow paused", resume: "Workflow resumed", retry: "Retry initiated", cancel: "Workflow cancelled" };
    setToast(labels[act]);
    setTimeout(() => setToast(null), 2500);
  }

  const failed = workflows.filter((w) => w.status === "Failed").length;
  const active = workflows.filter((w) => w.status === "Active").length;
  const totalRuns = workflows.reduce((a, w) => a + w.totalRuns, 0);
  const avgSuccess = Math.round(workflows.reduce((a, w) => a + w.successRate, 0) / workflows.length);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Workflow Health Monitor</h1>
        <p className="text-text-muted text-sm mt-1">Monitor, manage and manually override your Digital Employee workflows.</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active workflows", value: active, icon: Activity, colour: "text-emerald-400" },
          { label: "Failed", value: failed, icon: XCircle, colour: failed > 0 ? "text-red-400" : "text-text-muted" },
          { label: "Total runs (month)", value: totalRuns, icon: Clock, colour: "text-accent-blue" },
          { label: "Avg success rate", value: `${avgSuccess}%`, icon: CheckCircle2, colour: "text-accent-cyan" },
        ].map((m) => (
          <div key={m.label} className="glass rounded-xl border border-white/[0.06] p-4">
            <m.icon size={16} className={`${m.colour} mb-2`} />
            <p className={`font-heading font-bold text-xl ${m.colour}`}>{m.value}</p>
            <p className="text-text-muted text-xs mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Failed alert */}
      {failed > 0 && (
        <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-red-500/20">
          <AlertTriangle size={15} className="text-red-400" />
          <p className="text-red-300 text-sm font-medium">{failed} workflow{failed > 1 ? "s" : ""} failed — review and retry below</p>
        </div>
      )}

      {/* Workflow list */}
      <div className="space-y-3">
        {workflows.map((w) => {
          const Icon = STATUS_ICON[w.status];
          return (
            <div key={w.id} className="glass rounded-2xl border border-white/[0.08] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${STATUS_COLOUR[w.status]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary font-medium text-sm">{w.name}</p>
                    <p className="text-text-muted text-xs mt-0.5">{w.digitalEmployee}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_COLOUR[w.status]}`}>
                  {w.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div>
                  <p className="text-[10px] text-text-muted/50 mb-0.5">Last run</p>
                  <p className="text-xs text-text-muted">{fmt(w.lastRun)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted/50 mb-0.5">Success rate</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={`h-full rounded-full ${w.successRate >= 95 ? "bg-emerald-400" : w.successRate >= 80 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${w.successRate}%` }} />
                    </div>
                    <span className="text-xs text-text-muted">{w.successRate}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted/50 mb-0.5">Runs / failures</p>
                  <p className="text-xs text-text-muted">{w.totalRuns} total · {w.failedRuns} failed</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted/50 mb-0.5">Avg duration</p>
                  <p className="text-xs text-text-muted">{w.avgDuration}</p>
                </div>
              </div>

              {w.status === "Failed" && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <p className="text-xs text-red-400">{w.lastResult}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                {w.status === "Active" && (
                  <button onClick={() => action(w.id, "pause")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass border border-white/[0.08] hover:border-amber-500/30 text-text-muted hover:text-amber-300 transition-colors">
                    <Pause size={12} /> Pause
                  </button>
                )}
                {w.status === "Paused" && (
                  <button onClick={() => action(w.id, "resume")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass border border-white/[0.08] hover:border-emerald-500/30 text-text-muted hover:text-emerald-300 transition-colors">
                    <Play size={12} /> Resume
                  </button>
                )}
                {w.status === "Failed" && (
                  <button onClick={() => action(w.id, "retry")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/20 text-accent-blue transition-colors">
                    <RotateCcw size={12} /> Retry
                  </button>
                )}
                <button onClick={() => action(w.id, "cancel")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass border border-white/[0.08] hover:border-red-500/30 text-text-muted hover:text-red-300 transition-colors">
                  <StopCircle size={12} /> Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-accent-blue text-white text-sm font-medium shadow-lg shadow-accent-blue/30 animate-bounce-in">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
