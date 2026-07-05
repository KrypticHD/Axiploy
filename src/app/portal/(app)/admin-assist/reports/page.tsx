"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, TrendingUp, Clock, Activity, CheckCircle2, Sparkles } from "lucide-react";

interface ReportData {
  period: string;
  generatedAt: string;
  metrics: {
    tasksCompleted: number;
    meetingsHeld: number;
    emailsSent: number;
    pendingTasks: number;
    onboardingActive: number;
    approvalsPending: number;
  };
  recentActivity: { digital_employee: string; action: string; status: string; created_at: string }[];
  aiSummary: string | null;
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const [tasksRes, meetingsRes, activityRes, approvalsRes, onboardingRes, emailsRes] = await Promise.all([
        fetch("/api/portal/admin-assist/tasks").then((r) => r.json()),
        fetch("/api/portal/admin-assist/meetings").then((r) => r.json()),
        fetch("/api/portal/activity").then((r) => r.json()),
        fetch("/api/portal/approvals").then((r) => r.json()),
        fetch("/api/portal/onboarding").then((r) => r.json()),
        fetch("/api/portal/admin-assist/emails").then((r) => r.json()),
      ]);

      const tasks = tasksRes.tasks || [];
      const meetings = meetingsRes.meetings || [];
      const activity = activityRes.activity || activityRes.entries || [];
      const approvals = approvalsRes.approvals || [];
      const onboarding = onboardingRes.onboarding || onboardingRes.records || [];
      const emailDrafts = emailsRes.drafts || [];

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      setReport({
        period: "Last 7 days",
        generatedAt: now.toISOString(),
        metrics: {
          tasksCompleted: tasks.filter((t: { status: string; completed_at: string }) => t.status === "completed" && new Date(t.completed_at) > weekAgo).length,
          meetingsHeld: meetings.filter((m: { status: string }) => m.status === "completed").length,
          emailsSent: emailDrafts.filter((e: { status: string }) => e.status === "sent").length,
          pendingTasks: tasks.filter((t: { status: string }) => t.status !== "completed" && t.status !== "cancelled").length,
          onboardingActive: onboarding.filter((o: { status: string }) => !["Complete", "Cancelled"].includes(o.status)).length,
          approvalsPending: approvals.filter((a: { status: string }) => a.status === "pending").length,
        },
        recentActivity: activity.slice(0, 8),
        aiSummary: null,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReport(); }, []);

  async function handleGenerateSummary() {
    if (!report) return;
    setGenerating(true);
    // Call the briefing endpoint which already has Claude integration
    const res = await fetch("/api/portal/admin-assist/briefing");
    const data = await res.json();
    setGenerating(false);
    if (data.summary) {
      setReport((prev) => prev ? { ...prev, aiSummary: data.summary } : prev);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-text-muted/40" /></div>;
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Admin Reports</h1>
          <p className="text-text-muted text-[13px] mt-1">
            {report.period} · Generated {timeAgo(report.generatedAt)}
          </p>
        </div>
        <button onClick={handleGenerateSummary} disabled={generating || !!report.aiSummary}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[13px] font-medium hover:bg-accent-blue/20 transition-colors disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? "Generating..." : report.aiSummary ? "Summary Generated" : "Generate AI Summary"}
        </button>
      </div>

      {/* AI Summary */}
      {report.aiSummary && (
        <div className="glass rounded-xl p-4 border border-accent-blue/20 bg-accent-blue/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-accent-blue" />
            </div>
            <div>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">AI Summary</p>
              <p className="text-text-primary text-[13px] leading-relaxed">{report.aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Tasks Completed", value: report.metrics.tasksCompleted, icon: CheckCircle2, color: "text-emerald-400", note: "This week" },
          { label: "Meetings Held", value: report.metrics.meetingsHeld, icon: Clock, color: "text-accent-blue", note: "Total logged" },
          { label: "Emails Drafted & Sent", value: report.metrics.emailsSent, icon: FileText, color: "text-accent-cyan", note: "Via AI Draft" },
          { label: "Pending Tasks", value: report.metrics.pendingTasks, icon: Activity, color: "text-amber-400", note: "Needs action" },
          { label: "Active Onboardings", value: report.metrics.onboardingActive, icon: TrendingUp, color: "text-purple-400", note: "In progress" },
          { label: "Pending Approvals", value: report.metrics.approvalsPending, icon: CheckCircle2, color: report.metrics.approvalsPending > 0 ? "text-amber-400" : "text-emerald-400", note: report.metrics.approvalsPending > 0 ? "Needs review" : "All clear" },
        ].map((m) => (
          <div key={m.label} className="glass rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <m.icon size={14} className={m.color} />
              <p className="text-text-muted text-xs">{m.label}</p>
            </div>
            <p className="font-heading text-2xl font-bold text-text-primary">{m.value}</p>
            <p className="text-text-muted/50 text-xs mt-1">{m.note}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {report.recentActivity.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h2 className="text-[13px] font-semibold text-text-primary mb-4">Recent AI Activity</h2>
          <div className="space-y-2">
            {report.recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === "success" ? "bg-emerald-400" : item.status === "warning" ? "bg-amber-400" : item.status === "error" ? "bg-red-400" : "bg-text-muted/40"}`} />
                <p className="text-text-muted text-xs flex-1">{item.digital_employee}: {item.action}</p>
                <p className="text-text-muted/40 text-[10px] flex-shrink-0">{timeAgo(item.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
