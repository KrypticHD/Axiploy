import AnimatedSection from "./AnimatedSection";
import { Clock, Shield, UserPlus, FileBarChart, TrendingDown, Activity, Scale } from "lucide-react";

const outcomes = [
  { icon: Clock, stat: "300+", label: "Admin hours saved monthly" },
  { icon: Shield, stat: "100%", label: "Consistent compliance processes" },
  { icon: UserPlus, stat: "3×", label: "Faster onboarding completion" },
  { icon: FileBarChart, stat: "Real-time", label: "Reporting and visibility" },
  { icon: TrendingDown, stat: "↓ 60%", label: "Hiring pressure reduced" },
  { icon: Activity, stat: "24/7", label: "Always-on digital workforce" },
  { icon: Scale, stat: "Unlimited", label: "Scale without adding headcount" },
];

export default function Outcomes() {
  return (
    <section className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
            Results
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mt-3 mb-5">
            Measurable Business Outcomes
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            We focus on outcomes, not outputs. Here's what businesses achieve when they
            partner with Axiploy.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {outcomes.map((o, i) => (
            <AnimatedSection key={o.label} delay={i * 0.07}>
              <div className="glass rounded-2xl p-6 text-center group hover:border-accent-blue/25 transition-colors duration-300 border border-white/[0.08]">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-blue/20 transition-colors">
                  <o.icon size={18} className="text-accent-blue" />
                </div>
                <div className="font-heading text-2xl font-bold gradient-text mb-1">{o.stat}</div>
                <p className="text-text-muted text-xs leading-snug">{o.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
