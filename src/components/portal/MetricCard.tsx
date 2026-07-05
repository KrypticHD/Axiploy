import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "blue" | "cyan" | "amber" | "red" | "green" | "default";
  sub?: string;
}

const accentMap = {
  blue: { icon: "text-accent-blue", bg: "bg-accent-blue/10", border: "border-accent-blue/15" },
  cyan: { icon: "text-accent-cyan", bg: "bg-accent-cyan/10", border: "border-accent-cyan/15" },
  amber: { icon: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/15" },
  red: { icon: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/15" },
  green: { icon: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/15" },
  default: { icon: "text-text-muted", bg: "bg-white/[0.04]", border: "border-white/[0.08]" },
};

export default function MetricCard({ label, value, icon: Icon, accent = "default", sub }: MetricCardProps) {
  const a = accentMap[accent];
  return (
    <div className={`glass rounded-xl p-4 border ${a.border}`}>
      <div className="flex items-start justify-between mb-2.5">
        <p className="text-text-muted text-[11px] font-medium">{label}</p>
        <div className={`w-7 h-7 rounded-lg ${a.bg} flex items-center justify-center`}>
          <Icon size={13} className={a.icon} />
        </div>
      </div>
      <p className="font-heading text-xl font-bold text-text-primary leading-none">{value}</p>
      {sub && <p className="text-text-muted text-[11px] mt-1.5">{sub}</p>}
    </div>
  );
}
