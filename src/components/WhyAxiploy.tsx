import AnimatedSection from "./AnimatedSection";
import GlassCard from "./GlassCard";
import { Clock, Users, TrendingUp, Shield, RefreshCw, Zap } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Administrative Overload",
    description:
      "Staff spend hours on repetitive tasks — scheduling, reporting, data entry — instead of high-value work.",
  },
  {
    icon: Users,
    title: "Labour Shortages",
    description:
      "Hiring qualified staff is harder and more expensive than ever. AI employees fill the gap instantly.",
  },
  {
    icon: TrendingUp,
    title: "Rising Employment Costs",
    description:
      "Wages, superannuation, leave and training add up fast. AI employees scale without escalating costs.",
  },
  {
    icon: Shield,
    title: "Compliance Pressures",
    description:
      "Staying compliant requires consistent processes. AI employees follow rules without deviation or fatigue.",
  },
  {
    icon: RefreshCw,
    title: "Manual Processes",
    description:
      "Slow, error-prone manual workflows create bottlenecks and drag on operational performance.",
  },
  {
    icon: Zap,
    title: "Slow Customer Response",
    description:
      "Customers expect instant responses. AI employees engage 24/7, improving satisfaction and conversion.",
  },
];

export default function WhyAxiploy() {
  return (
    <section className="py-28 relative">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
            The Problem
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mt-3 mb-5">
            Why Businesses Choose Axiploy
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Every growing business hits the same wall. Axiploy breaks through it
            with AI employees that do the work — reliably, at scale.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <AnimatedSection key={p.title} delay={i * 0.08}>
              <GlassCard className="h-full hover:border-accent-blue/20 transition-colors duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-4 group-hover:bg-accent-blue/20 transition-colors">
                  <p.icon size={20} className="text-accent-blue" />
                </div>
                <h3 className="font-heading font-semibold text-text-primary mb-2">
                  {p.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  {p.description}
                </p>
              </GlassCard>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
