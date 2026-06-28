import AnimatedSection from "./AnimatedSection";
import { PhoneCall, Lightbulb, Rocket, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: PhoneCall,
    title: "Discovery Call",
    description:
      "We take the time to understand your business, your team and the challenges slowing you down.",
  },
  {
    number: "02",
    icon: Lightbulb,
    title: "Solution Design",
    description:
      "We identify the highest-impact AI opportunities and design a tailored digital employee for your operations.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Implementation",
    description:
      "Your AI employees are built, tested and deployed — integrated into your existing workflows with minimal disruption.",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Ongoing Optimisation",
    description:
      "We monitor performance, gather feedback and continuously refine your AI employees to deliver better results over time.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-28 bg-surface/30">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
            The Process
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mt-3 mb-5">
            How It Works
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            From initial conversation to deployed AI employees — we handle everything.
          </p>
        </AnimatedSection>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-accent-blue/30 via-accent-cyan/30 to-accent-blue/30" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <AnimatedSection key={s.number} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center lg:items-center">
                  {/* Icon circle */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 border border-accent-blue/20 flex items-center justify-center glow-blue">
                      <s.icon size={24} className="text-accent-cyan" />
                    </div>
                    <span className="absolute -top-2 -right-2 text-xs font-bold text-accent-blue bg-surface border border-accent-blue/30 rounded-full w-6 h-6 flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-text-primary mb-2">{s.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{s.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
