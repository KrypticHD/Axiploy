import AnimatedSection from "./AnimatedSection";
import Link from "next/link";
import { UserCheck, ClipboardList, TrendingUp, Users, DollarSign, FolderKanban, Settings, ArrowRight, Lock } from "lucide-react";

const current = [
  {
    href: "/services/ai-onboarding-assistant",
    icon: UserCheck,
    title: "AI Onboarding Assistant",
    description:
      "Automates employee and contractor onboarding — documents, inductions, forms and follow-ups handled without manual effort.",
    industries: ["Labour Hire", "Construction", "Mining"],
  },
  {
    href: "/services/ai-administrative-assistant",
    icon: ClipboardList,
    title: "AI Administrative Assistant",
    description:
      "Handles scheduling, reporting, data entry and communications so your team can focus on work that matters.",
    industries: ["Professional Services", "Recruitment", "Engineering"],
  },
  {
    href: "/services/ai-growth-assistant",
    icon: TrendingUp,
    title: "AI Growth Assistant",
    description:
      "Drives lead follow-up, client engagement and pipeline management — converting opportunities without manual effort.",
    industries: ["Property", "Trades", "Recruitment"],
  },
];

const coming = [
  { icon: Users, title: "AI Recruitment Coordinator" },
  { icon: DollarSign, title: "AI Accounts Assistant" },
  { icon: FolderKanban, title: "AI Project Coordinator" },
  { icon: Settings, title: "AI Operations Manager" },
];

export default function ServicesGrid() {
  return (
    <section id="services" className="py-28 bg-surface/30">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
            Digital Employees
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mt-3 mb-5">
            Your AI Workforce
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Intelligent digital employees designed to perform specific business functions —
            deployed fast, optimised continuously.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {current.map((s, i) => (
            <AnimatedSection key={s.title} delay={i * 0.1}>
              <div className="glass rounded-2xl p-7 h-full flex flex-col group hover:border-accent-blue/25 transition-colors duration-300 border border-white/[0.08]">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center mb-5">
                  <s.icon size={22} className="text-accent-cyan" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-3">
                  {s.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed mb-5 flex-1">
                  {s.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {s.industries.map((ind) => (
                    <span
                      key={ind}
                      className="text-xs px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent-cyan hover:text-accent-blue transition-colors group-hover:gap-3 duration-200"
                >
                  Learn More <ArrowRight size={14} />
                </Link>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Coming soon */}
        <AnimatedSection delay={0.3}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {coming.map((c) => (
              <div
                key={c.title}
                className="glass rounded-2xl p-5 flex items-center gap-3 opacity-60 border border-dashed border-white/10"
              >
                <Lock size={14} className="text-text-muted shrink-0" />
                <div>
                  <p className="text-text-muted text-xs font-medium">{c.title}</p>
                  <p className="text-text-muted/60 text-xs mt-0.5">Coming soon</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
