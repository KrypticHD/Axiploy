"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, XCircle, Clock, BarChart2, RefreshCw, MessageSquare } from "lucide-react";

interface Workflow {
  name: string;
  digital_employee: string;
  status: string;
  last_run: string;
  last_result: string;
  total_runs: number;
  failed_runs: number;
  success_rate: number;
  avg_duration_ms: number;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Failed") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle size={10} /> Failed
    </span>
  );
  if (status === "Active") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 size={10} /> Active
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/[0.04] text-text-muted border border-white/[0.08]">
      <Clock size={10} /> {status}
    </span>
  );
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  function load() {
    setLoading(true);
    fetch("/api/portal/workflows")
      .then((r) => r.json())
      .then((d) => { setWorkflows(d.workflows || []); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const active = workflows.filter((w) => w.status === "Active").length;
  const failed = workflows.filter((w) => w.status === "Failed").length;
  const totalRuns = workflows.reduce((s, w) => s + w.total_runs, 0);
  const avgSuccess = workflows.length > 0
    ? Math.round(workflows.reduce((s, w) => s + w.success_rate, 0) / workflows.length)
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Workflow Health</h1>
          <p className="text-text-muted text-sm mt-1">Real-time status of your AI workforce automations.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/[0.10] hover:border-accent-blue/30 hover:text-accent-blue text-text-muted text-xs font-medium transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active", value: active, colour: "text-emerald-400", icon: CheckCircle2 },
          { label: "Failed", value: failed, colour: "text-red-400", icon: XCircle },
          { label: "Total Runs", value: totalRuns, colour: "text-accent-blue", icon: Activity },
          { label: "Avg Success Rate", value: `${avgSuccess}%`, colour: "text-accent-cyan", icon: BarChart2 },
        ].map((m) => (
          <div key={m.label} className="glass rounded-2xl p-4 border border-white/[0.08] text-center">
            <m.icon size={14} className={`${m.colour} mx-auto mb-2`} />
            <p className={`font-heading font-bold text-xl ${m.colour}`}>{m.value}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-accent-blue/10 bg-accent-blue/[0.03] p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
          <Activity size={14} className="text-accent-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-medium">Managed by Axiploy</p>
          <p className="text-text-muted text-xs mt-0.5">Workflow configuration, scheduling, and monitoring are fully managed by the Axiploy team. Contact us to make changes.</p>
        </div>
        <Link
          href="/portal/support"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/20 text-accent-blue text-xs font-medium transition-colors"
        >
          <MessageSquare size={12} /> Request change
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-text-muted text-sm">Loading workflows…</div>
      ) : workflows.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/[0.06]">
          <Activity size={28} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-primary text-sm font-medium">No workflow activity yet</p>
          <p className="text-text-muted text-xs mt-1">Activity will appear here once your AI employees start running automations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <div key={w.name} className="glass rounded-xl border border-white/[0.06] p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-text-primary font-medium text-sm">{w.name}</p>
                  <p className="text-text-muted text-xs mt-0.5">{w.digital_employee}</p>
                </div>
                <StatusBadge status={w.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Runs", value: String(w.total_runs) },
                  { label: "Failed", value: String(w.failed_runs), colour: w.failed_runs > 0 ? "text-red-400" : undefined },
                  { label: "Success Rate", value: `${w.success_rate}%`, colour: w.success_rate >= 90 ? "text-emerald-400" : w.success_rate >= 70 ? "text-amber-400" : "text-red-400" },
                  { label: "Avg Duration", value: fmtDuration(w.avg_duration_ms) },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.02] rounded-lg p-3 text-center">
                    <p className={`font-heading font-bold text-base ${s.colour || "text-text-primary"}`}>{s.value}</p>
                    <p className="text-text-muted text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {w.last_run && (
                <p className="text-text-muted/50 text-[10px] mt-3">
                  Last run {new Date(w.last_run).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {w.last_result ? ` · ${w.last_result}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-text-muted/40 text-[10px]">
        Last updated {lastRefresh.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
    </div>
  );
}
