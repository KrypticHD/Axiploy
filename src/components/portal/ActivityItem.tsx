import type { ActivityEntry } from "@/lib/types";
import StatusPill from "./StatusPill";
import AgentAvatar from "./AgentAvatar";

const deType: Record<string, string> = {
  "AI Onboarding Assistant": "onboarding",
  "AI Admin Assistant": "admin",
  "AI Growth Assistant": "growth",
  "AI Social Media Manager": "social",
  "AI Compliance Assistant": "compliance",
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const type = deType[entry.digitalEmployee] ?? "admin";
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <AgentAvatar type={type} size={24} />
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-[13px] leading-snug">{entry.action}</p>
        {entry.result && <p className="text-text-muted text-[11px] mt-0.5 truncate">{entry.result}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-text-muted/60 text-[11px]">{formatTime(entry.timestamp)}</span>
          <span className="text-text-muted/40 text-[11px]">·</span>
          <span className="text-text-muted/60 text-[11px]">{entry.digitalEmployee}</span>
        </div>
      </div>
      <StatusPill status={entry.status} size="sm" />
    </div>
  );
}
