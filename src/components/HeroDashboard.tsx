"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  LayoutDashboard, Inbox, Bot, UserCheck, FileText, ShieldCheck,
  Send, BarChart2, Settings, Mail, AlertTriangle, CheckCircle2, Clock,
  Sparkles, Paperclip, ArrowUp, MoreHorizontal, Search, SlidersHorizontal, MessageSquare,
} from "lucide-react";

const sidebarItems = [
  { label: "Ask Axiploy", icon: MessageSquare, highlight: true },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Inbox", icon: Inbox, active: true, badge: 3 },
  { label: "AI Employees", icon: Bot },
  { label: "Onboarding", icon: UserCheck },
  { label: "Quotes", icon: FileText },
  { label: "Safety Docs", icon: ShieldCheck },
  { label: "Follow-ups", icon: Send },
  { label: "Insights", icon: BarChart2 },
  { label: "Settings", icon: Settings },
];

const agents = [
  { name: "AI Admin", short: "AD", color: "from-accent-blue to-accent-cyan", working: true },
  { name: "AI Onboarding", short: "ON", color: "from-accent-cyan to-emerald-400" },
  { name: "AI Social", short: "SO", color: "from-fuchsia-400 to-accent-blue" },
  { name: "AI Growth", short: "GR", color: "from-indigo-400 to-accent-cyan" },
];

const inboxItems = [
  {
    title: "Subcontractor onboarding",
    sub: "AI Admin flagged expired permit",
    time: "8m",
    agent: agents[0],
    active: true,
    dot: "bg-amber-400",
  },
  {
    title: "Quote follow-up · Hargreaves Civil",
    sub: "AI Growth drafted follow-up email",
    time: "1h",
    agent: agents[3],
    dot: "bg-accent-cyan",
  },
  {
    title: "This week's social posts",
    sub: "AI Social drafted 4 posts for approval",
    time: "4h",
    agent: agents[2],
    dot: "bg-accent-cyan",
  },
  {
    title: "New starter induction pack",
    sub: "AI Onboarding compiled documents",
    time: "1d",
    agent: agents[1],
    dot: "bg-emerald-400",
  },
];

const intelligence = [
  {
    label: "Reviewed",
    value: "Worker documents received and checked",
    icon: Mail,
    color: "text-accent-blue",
  },
  {
    label: "Flagged",
    value: "Working at Heights permit expired",
    icon: AlertTriangle,
    color: "text-amber-400",
  },
  {
    label: "Drafted",
    value: "Reminder email — waiting for approval",
    icon: Clock,
    color: "text-accent-cyan",
  },
  {
    label: "Updated",
    value: "Onboarding tracker marked current",
    icon: CheckCircle2,
    color: "text-emerald-400",
  },
];

const feed = [
  { text: "AI Admin read new email from contractor", time: "2min ago" },
  { text: "Extracted worker name, role and document attachments", time: "2min ago" },
  { text: "Checked expiry dates against onboarding requirements", time: "1min ago" },
  { text: "Flagged expired Working at Heights permit", time: "1min ago" },
  { text: "Drafted follow-up email for approval", time: "just now" },
  { text: "Updated Airtable onboarding tracker", time: "just now" },
];

const FEED_START = 1.4;
const FEED_STAGGER = 0.55;

function AgentAvatar({ agent, size = 24 }: { agent: (typeof agents)[number]; size?: number }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br ${agent.color} text-white font-semibold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {agent.short}
      {agent.working && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-base animate-pulse" />
      )}
    </span>
  );
}

export default function HeroDashboard() {
  return (
    <div className="relative rounded-2xl overflow-hidden glass glow-border shadow-2xl shadow-accent-blue/10 text-left bg-base/90">
      <div className="flex min-h-[480px] lg:min-h-[540px]">
        {/* ── Sidebar ── */}
        <div className="hidden md:flex flex-col w-48 shrink-0 bg-surface/60 border-r border-white/[0.06] py-3">
          <div className="flex items-center justify-between px-4 pb-3 mb-1">
            <Image src="/logo.png" alt="Axiploy" width={110} height={32} className="h-6 w-auto object-contain" />
            <span className="flex items-center gap-2 text-text-muted/50">
              <Search size={12} />
            </span>
          </div>
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 mx-2 px-2.5 py-[6px] rounded-lg text-[12px] font-medium ${
                item.active
                  ? "bg-white/[0.06] text-text-primary"
                  : item.highlight
                  ? "text-accent-blue border border-accent-blue/15 bg-accent-blue/[0.06] mb-1"
                  : "text-text-muted/80"
              }`}
            >
              <item.icon size={13} className={item.active || item.highlight ? "text-accent-blue" : "text-text-muted/60"} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/15 rounded-full px-1.5">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
          <div className="mt-auto px-4 pt-3 border-t border-white/[0.06] mx-2">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted/40 mb-2">
              AI Employees
            </p>
            <div className="space-y-1.5">
              {agents.map((a) => (
                <div key={a.name} className="flex items-center gap-2">
                  <AgentAvatar agent={a} size={18} />
                  <span className="text-[11px] text-text-muted">{a.name}</span>
                  {a.working && <span className="text-[9px] text-emerald-400 ml-auto">working</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Inbox list ── */}
        <div className="hidden sm:flex flex-col w-64 lg:w-72 shrink-0 border-r border-white/[0.06] bg-surface/30">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold text-text-primary">Inbox</span>
            <span className="flex items-center gap-2 text-text-muted/50">
              <SlidersHorizontal size={12} />
              <MoreHorizontal size={13} />
            </span>
          </div>
          {inboxItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
              className={`flex items-start gap-2.5 px-4 py-3 border-b border-white/[0.04] ${
                item.active ? "bg-white/[0.05]" : ""
              }`}
            >
              <AgentAvatar agent={item.agent} size={26} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-text-primary truncate">{item.title}</p>
                <p className="text-[11px] text-text-muted truncate mt-0.5">{item.sub}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] text-text-muted/60">{item.time}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Detail panel ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold text-text-primary truncate">
              Subcontractor onboarding
            </span>
            <MoreHorizontal size={14} className="text-text-muted/50 shrink-0" />
          </div>

          <div className="flex-1 px-5 sm:px-8 py-6 overflow-hidden">
            <div className="max-w-xl">
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-text-primary mb-2">
                Subcontractor onboarding
              </h3>
              <p className="text-text-muted text-[13px] leading-relaxed mb-6">
                AI Admin has reviewed the worker documents, flagged missing tickets, drafted the
                reminder email and updated the onboarding tracker.
              </p>

              {/* AI intelligence card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="glass rounded-xl border border-white/[0.07] p-4 mb-7"
              >
                <div className="flex items-center gap-2 mb-3.5">
                  <Sparkles size={13} className="text-accent-cyan" />
                  <span className="text-[12px] font-semibold text-text-primary">AI Admin — Intelligence</span>
                  <MoreHorizontal size={13} className="text-text-muted/40 ml-auto" />
                </div>
                <div className="space-y-2.5">
                  {intelligence.map((row, i) => (
                    <motion.div
                      key={row.label}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.9 + i * 0.15 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-[11px] text-text-muted/60 w-16 shrink-0">{row.label}</span>
                      <row.icon size={13} className={`${row.color} shrink-0`} />
                      <span className="text-[12px] text-text-primary/90 truncate">{row.value}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Activity */}
              <p className="text-[13px] font-semibold text-text-primary mb-3">Activity</p>
              <div className="space-y-2.5 mb-7">
                {feed.map((line, i) => (
                  <motion.div
                    key={line.text}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: FEED_START + i * FEED_STAGGER }}
                    className="flex items-center gap-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/70 shrink-0" />
                    <p className="text-[12px] text-text-muted truncate">
                      {line.text}
                      <span className="text-text-muted/40"> · {line.time}</span>
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Approval box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: FEED_START + feed.length * FEED_STAGGER + 0.3 }}
                className="glass rounded-xl border border-white/[0.07] px-4 py-3 flex items-center gap-3"
              >
                <p className="text-[12px] text-text-muted flex-1">
                  Approve reminder email to contractor
                  <span className="inline-flex ml-0.5 text-text-muted/60">
                    <span className="animate-bounce [animation-delay:0ms]">.</span>
                    <span className="animate-bounce [animation-delay:150ms]">.</span>
                    <span className="animate-bounce [animation-delay:300ms]">.</span>
                  </span>
                </p>
                <Paperclip size={13} className="text-text-muted/40" />
                <span className="w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center">
                  <ArrowUp size={13} className="text-white" />
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade for depth */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-base/70 to-transparent" />
    </div>
  );
}
