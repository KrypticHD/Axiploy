import type { Metadata } from "next";
import AnimatedSection from "@/components/AnimatedSection";
import GlassCard from "@/components/GlassCard";
import CtaBanner from "@/components/CtaBanner";
import { Brain, GitMerge, Lock, Cloud, RefreshCw, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Technology — Axiploy",
  description:
    "The technology behind Axiploy's AI employees — intelligent workflows, secure integrations and enterprise-grade cloud infrastructure.",
};

const tech = [
  {
    icon: Brain,
    title: "Artificial Intelligence",
    description:
      "Powered by advanced language models and decision-making systems, our AI employees understand context, adapt to your processes and improve with every interaction.",
  },
  {
    icon: GitMerge,
    title: "Intelligent Workflows",
    description:
      "We design purpose-built workflow automations that mirror how your business actually operates — not generic templates that require you to adapt to the tool.",
  },
  {
    icon: Lock,
    title: "Secure Integrations",
    description:
      "Your AI employees connect securely to your existing systems — HR platforms, CRMs, project management tools — without requiring you to rip and replace existing infrastructure.",
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure",
    description:
      "Built on resilient, scalable cloud infrastructure that ensures your AI employees are always available and can handle peak operational demands without performance degradation.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Data security is foundational. All AI employees operate within secure boundaries with role-based access, encrypted data handling and audit logging built in from the start.",
  },
  {
    icon: RefreshCw,
    title: "Continuous Learning",
    description:
      "Your AI employees don't stay static. We monitor performance, analyse outcomes and refine processes — so your digital workforce improves the longer it operates.",
  },
];

export default function TechnologyPage() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[400px] rounded-full bg-accent-cyan/8 blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-accent-blue/8 blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <AnimatedSection>
            <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
              Technology
            </span>
            <h1 className="font-heading text-5xl sm:text-6xl font-bold text-text-primary mt-3 mb-6">
              The Engine Behind{" "}
              <span className="gradient-text">Every AI Employee</span>
            </h1>
            <p className="text-text-muted text-xl leading-relaxed max-w-2xl mx-auto">
              Technology is not the product — it is what powers the outcomes. Here is what
              makes Axiploy AI employees reliable, secure and effective.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Tech cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tech.map((t, i) => (
              <AnimatedSection key={t.title} delay={i * 0.09}>
                <GlassCard className="h-full hover:border-accent-blue/20 transition-colors duration-300 group p-7">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center mb-5 group-hover:from-accent-blue/30 transition-colors">
                    <t.icon size={22} className="text-accent-cyan" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-text-primary mb-3">
                    {t.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">{t.description}</p>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Principle callout */}
      <section className="py-16 pb-8">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center glass rounded-3xl p-10 border border-white/[0.08]">
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Technology in Service of Outcomes
              </h2>
              <p className="text-text-muted leading-relaxed">
                We do not lead with the stack. We lead with the result. Every technology
                decision we make is driven by one question: does this help your business
                perform better? If it does not serve that goal, we do not use it.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}
