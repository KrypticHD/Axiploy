import type { ActivityEntry } from "@/lib/types";
import StatusPill from "./StatusPill";
import { Bot, UserCheck, ClipboardList, TrendingUp } from "lucide-react";

const deIcon: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "AI Onboarding Assistant": UserCheck,
  "AI Admin Assistant": ClipboardList,
  "AI Growth Assistant": TrendingUp,
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const Icon = deIcon[entry.digitalEmployee] ?? Bot;
  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/[0.05] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-accent-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm">{entry.action}</p>
        <p className="text-text-muted text-xs mt-0.5 truncate">{entry.result}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-text-muted/60 text-xs">{formatTime(entry.timestamp)}</span>
          <span className="text-text-muted/40 text-xs">·</span>
          <span className="text-text-muted/60 text-xs">{entry.digitalEmployee}</span>
        </div>
      </div>
      <StatusPill status={entry.status} />
    </div>
  );
}
