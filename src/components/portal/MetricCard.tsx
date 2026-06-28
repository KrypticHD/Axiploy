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
    <div className={`glass rounded-2xl p-5 border ${a.border}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-text-muted text-xs font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center`}>
          <Icon size={15} className={a.icon} />
        </div>
      </div>
      <p className="font-heading text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}
