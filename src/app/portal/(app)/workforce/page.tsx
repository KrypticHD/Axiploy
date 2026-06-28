import StatusPill from "@/components/portal/StatusPill";
import Link from "next/link";
import { UserCheck, ClipboardList, TrendingUp, ArrowRight, Settings } from "lucide-react";
import { MOCK_DIGITAL_EMPLOYEES } from "@/lib/mock-data";

const deIcons = { onboarding: UserCheck, admin: ClipboardList, growth: TrendingUp };
const deLinks = {
  onboarding: "/portal/onboarding",
  admin: "/portal/activity",
  growth: "/portal/approvals",
};
const deDescriptions = {
  onboarding: "Automates employee and contractor onboarding — documents, inductions, forms and follow-ups handled without manual effort.",
  admin: "Handles scheduling, reporting, data entry and communications so your team can focus on work that matters.",
  growth: "Drives lead follow-up, client engagement and pipeline management — converting opportunities without manual effort.",
};

export default function WorkforcePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">AI Workforce</h1>
        <p className="text-text-muted text-sm mt-1">Your active digital employees and their current work.</p>
      </div>

      <div className="grid gap-5">
        {MOCK_DIGITAL_EMPLOYEES.map((de) => {
          const Icon = deIcons[de.type];
          const href = deLinks[de.type];
          return (
            <div key={de.id} className="glass rounded-2xl p-7 border border-white/[0.08] hover:border-accent-blue/20 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 border border-accent-blue/15 flex items-center justify-center">
                    <Icon size={22} className="text-accent-cyan" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-text-primary">{de.name}</h2>
                    <p className="text-text-muted text-sm mt-0.5">{deDescriptions[de.type]}</p>
                  </div>
                </div>
                <StatusPill status={de.status} size="md" />
              </div>

              {/* Current work stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {de.stats.map((s) => (
                  <div key={s.label} className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/[0.04]">
                    <p className="font-heading font-bold text-text-primary text-2xl">{s.value}</p>
                    <p className="text-text-muted text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors"
                >
                  View Dashboard <ArrowRight size={14} />
                </Link>
                <Link
                  href="/portal/reports"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-white/[0.10] hover:border-white/20 text-text-primary text-sm font-medium transition-colors"
                >
                  View Reports
                </Link>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-white/[0.10] hover:border-white/20 text-text-muted text-sm font-medium transition-colors">
                  <Settings size={14} /> Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
