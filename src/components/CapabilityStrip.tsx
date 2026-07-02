import AnimatedSection from "./AnimatedSection";
import { Inbox, UserCheck, FileText, Send, DollarSign, Users } from "lucide-react";

const capabilities = [
  { icon: Inbox, label: "Inbox management" },
  { icon: UserCheck, label: "Onboarding" },
  { icon: FileText, label: "Quotes" },
  { icon: Send, label: "Follow-ups" },
  { icon: DollarSign, label: "Accounts" },
  { icon: Users, label: "Recruitment" },
];

export default function CapabilityStrip() {
  return (
    <section className="py-10 border-y border-white/[0.05] bg-surface/20">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <span className="text-text-muted/60 text-xs font-semibold tracking-widest uppercase">
              AI employees handle
            </span>
            {capabilities.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-2 text-sm text-text-muted">
                <c.icon size={15} className="text-accent-cyan/70" />
                {c.label}
              </span>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
