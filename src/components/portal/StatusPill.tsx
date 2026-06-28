import type { EmployeeStatus, RiskLevel, ActivityStatus } from "@/lib/types";

const statusStyles: Record<string, string> = {
  New: "bg-slate-500/15 text-slate-300 border-slate-500/25",
  "Welcome Sent": "bg-blue-500/15 text-blue-300 border-blue-500/25",
  "In Progress": "bg-blue-600/15 text-blue-400 border-blue-600/25",
  "Missing Documents": "bg-orange-500/15 text-orange-300 border-orange-500/25",
  "At Risk": "bg-amber-500/15 text-amber-300 border-amber-500/25",
  "Ready for Review": "bg-violet-500/15 text-violet-300 border-violet-500/25",
  Complete: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Paused: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  Cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  // Risk
  Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  High: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  Critical: "bg-red-500/15 text-red-400 border-red-500/25",
  // Activity
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  error: "bg-red-500/15 text-red-400 border-red-500/25",
  info: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  // Report
  ready: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  generating: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  scheduled: "bg-slate-500/15 text-slate-300 border-slate-500/25",
  // DE status
  Active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Setup: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Paused2: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

interface StatusPillProps {
  status: EmployeeStatus | RiskLevel | ActivityStatus | string;
  size?: "sm" | "md";
}

export default function StatusPill({ status, size = "sm" }: StatusPillProps) {
  const cls = statusStyles[status] ?? "bg-slate-500/15 text-slate-300 border-slate-500/25";
  return (
    <span
      className={`inline-flex items-center border rounded-full font-medium ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${cls}`}
    >
      {status}
    </span>
  );
}
