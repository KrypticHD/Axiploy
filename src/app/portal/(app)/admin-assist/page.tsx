"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar, ListTodo, CheckCircle2, AlertTriangle, Clock, Inbox, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface BriefingData {
  date: string;
  summary: string | null;
  meetings: { id: string; title: string; start_time: string; end_time?: string; location?: string }[];
  tasks: { total: number; urgent: number; overdue: number; items: { id: string; title: string; priority: string; due_date?: string }[] };
  approvals: number;
  activity: { digital_employee: string; action: string; status: string }[];
  onboarding: number;
  emails?: { unread: number; preview: string[] };
}

const PRIORITY_STYLE: Record<string, string> = {
  urgent: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  low: "text-text-muted bg-white/[0.05] border-white/[0.08]",
};

export default function AdminBriefingPage() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/admin-assist/briefing")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={24} className="animate-spin text-text-muted/40" />
        <p className="text-text-muted text-[13px]">Preparing your daily briefing...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-text-muted text-[13px]">{data.date}</p>
        <h1 className="font-heading text-xl font-semibold text-text-primary mt-1">Daily Briefing</h1>
      </div>

      {/* AI Summary */}
      {data.summary && (
        <div className="glass rounded-xl p-4 border border-accent-blue/20 bg-accent-blue/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={14} className="text-accent-blue" />
            </div>
            <div>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">AI Briefing</p>
              <p className="text-text-primary text-[13px] leading-relaxed">{data.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className={`grid grid-cols-2 gap-4 ${data.emails ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {[
          { label: "Pending Tasks", value: data.tasks.total, sub: data.tasks.overdue > 0 ? `${data.tasks.overdue} overdue` : "All on track", subColor: data.tasks.overdue > 0 ? "text-red-400" : "text-emerald-400", href: "/portal/admin-assist/tasks", icon: ListTodo },
          { label: "Today's Meetings", value: data.meetings.length, sub: data.meetings.length === 0 ? "Clear schedule" : `Next: ${data.meetings[0] ? new Date(data.meetings[0].start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }) : ""}`, subColor: "text-text-muted", href: "/portal/admin-assist/meetings", icon: Calendar },
          { label: "Pending Approvals", value: data.approvals, sub: data.approvals === 0 ? "Nothing waiting" : "Needs attention", subColor: data.approvals > 0 ? "text-amber-400" : "text-text-muted", href: "/portal/approvals", icon: CheckCircle2 },
          { label: "Active Onboardings", value: data.onboarding, sub: "Employees in progress", subColor: "text-text-muted", href: "/portal/onboarding", icon: AlertTriangle },
          ...(data.emails ? [{ label: "Unread Emails", value: data.emails.unread, sub: data.emails.unread === 0 ? "Inbox clear" : "In Outlook inbox", subColor: data.emails.unread > 0 ? "text-amber-400" : "text-emerald-400", href: "/portal/admin-assist/inbox", icon: Inbox }] : []),
        ].map((s) => (
          <Link key={s.label} href={s.href} className="glass rounded-xl p-4 border border-white/[0.06] hover:border-accent-blue/20 transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} className="text-text-muted" />
              <p className="text-text-muted text-xs">{s.label}</p>
            </div>
            <p className="font-heading text-2xl font-bold text-text-primary">{s.value}</p>
            <p className={`text-xs mt-1 ${s.subColor}`}>{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's meetings */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-text-primary">Today&apos;s Meetings</h2>
            <Link href="/portal/admin-assist/meetings" className="text-xs text-text-muted hover:text-accent-blue flex items-center gap-1 transition-colors">
              All meetings <ChevronRight size={12} />
            </Link>
          </div>
          {data.meetings.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={20} className="text-text-muted/20 mx-auto mb-2" />
              <p className="text-text-muted/50 text-sm">No meetings today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.meetings.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-9 h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-accent-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-[13px] font-medium truncate">{m.title}</p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {new Date(m.start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                      {m.end_time && ` — ${new Date(m.end_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`}
                      {m.location && ` · ${m.location}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority tasks */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-text-primary">Priority Tasks</h2>
            <Link href="/portal/admin-assist/tasks" className="text-xs text-text-muted hover:text-accent-blue flex items-center gap-1 transition-colors">
              All tasks <ChevronRight size={12} />
            </Link>
          </div>
          {data.tasks.items.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 size={20} className="text-text-muted/20 mx-auto mb-2" />
              <p className="text-text-muted/50 text-sm">No pending tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.tasks.items.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium}`}>
                    {task.priority}
                  </span>
                  <p className="text-text-muted text-[13px] flex-1 truncate">{task.title}</p>
                  {task.due_date && (
                    <p className={`text-[10px] flex-shrink-0 ${new Date(task.due_date) < new Date() ? "text-red-400" : "text-text-muted/50"}`}>
                      {new Date(task.due_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Draft an Email", desc: "AI writes it, you send it", href: "/portal/admin-assist/emails", icon: Inbox },
          { label: "Add a Task", desc: "Create and assign tasks", href: "/portal/admin-assist/tasks", icon: ListTodo },
          { label: "Schedule a Meeting", desc: "Book time with your team", href: "/portal/admin-assist/meetings", icon: Calendar },
        ].map((a) => (
          <Link key={a.label} href={a.href}
            className="glass rounded-xl p-4 border border-white/[0.06] hover:border-accent-blue/20 transition-colors group flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <a.icon size={14} className="text-text-muted group-hover:text-accent-blue transition-colors" />
            </div>
            <div>
              <p className="text-text-primary text-[13px] font-medium">{a.label}</p>
              <p className="text-text-muted text-xs">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
