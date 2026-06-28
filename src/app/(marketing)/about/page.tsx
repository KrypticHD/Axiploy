import type { Metadata } from "next";
import AnimatedSection from "@/components/AnimatedSection";
import GlassCard from "@/components/GlassCard";
import CtaBanner from "@/components/CtaBanner";
import { Target, Eye, Cpu, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Axiploy",
  description:
    "Learn about Axiploy's mission to help businesses deploy intelligent AI employees that deliver measurable operational improvements.",
};

const pillars = [
  {
    icon: Target,
    title: "Why We Exist",
    description:
      "Most businesses know AI matters but don't know where to start. Axiploy bridges that gap — delivering practical AI implementation that creates real, measurable change inside real businesses.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    description:
      "A future where every business, regardless of size, has access to a capable AI workforce that handles the repetitive, administrative and time-consuming work — freeing people to focus on what humans do best.",
  },
  {
    icon: Cpu,
    title: "Our Philosophy",
    description:
      "We believe AI should be practical, not theoretical. We don't build for the sake of building. Every AI employee we deploy solves a specific business problem and delivers outcomes you can measure.",
  },
  {
    icon: BarChart3,
    title: "Our Commitment",
    description:
      "Measurable results are our standard. We track what matters — time saved, processes completed, compliance achieved — and we continuously optimise your AI employees to improve over time.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent-blue/8 blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <AnimatedSection>
            <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
              About Axiploy
            </span>
            <h1 className="font-heading text-5xl sm:text-6xl font-bold text-text-primary mt-3 mb-6">
              The Trusted Partner for{" "}
              <span className="gradient-text">AI Adoption</span>
            </h1>
            <p className="text-text-muted text-xl leading-relaxed max-w-2xl mx-auto">
              Axiploy exists to make AI implementation practical, accessible and impactful
              for growing businesses. We are your outsourced AI department.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission pillars */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p, i) => (
              <AnimatedSection key={p.title} delay={i * 0.1}>
                <GlassCard className="h-full hover:border-accent-blue/20 transition-colors duration-300 group p-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center mb-5 group-hover:from-accent-blue/30 transition-colors">
                    <p.icon size={22} className="text-accent-cyan" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-text-primary mb-3">
                    {p.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed">{p.description}</p>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Long-term vision */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection>
            <div className="glass rounded-3xl p-10 border border-accent-blue/15">
              <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
                Long-Term Vision
              </span>
              <h2 className="font-heading text-3xl font-bold text-text-primary mt-3 mb-5">
                The Outsourced AI Department for Every Business
              </h2>
              <div className="space-y-4 text-text-muted leading-relaxed">
                <p>
                  Axiploy is not an automation agency. Our long-term ambition is to become a
                  leading AI workforce company that enables businesses to deploy intelligent
                  Digital Employees across every department.
                </p>
                <p>
                  As AI adoption accelerates, we aim to become the trusted outsourced AI
                  department for small and medium-sized businesses — providing scalable, secure
                  and practical AI solutions that deliver measurable operational improvements.
                </p>
                <p>
                  The future of work is not humans versus AI. It is humans and AI working
                  together — each doing what they do best. Axiploy makes that future accessible today.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}
