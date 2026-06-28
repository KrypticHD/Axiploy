import AnimatedSection from "./AnimatedSection";
import GlassCard from "./GlassCard";
import CtaBanner from "./CtaBanner";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface ServiceData {
  title: string;
  tagline: string;
  overview: string;
  problems: string[];
  features: { title: string; description: string }[];
  benefits: string[];
  workflow: { step: string; description: string }[];
  industries: string[];
  faqs: { q: string; a: string }[];
  icon: LucideIcon;
}

export default function ServicePage({ data }: { data: ServiceData }) {
  const Icon = data.icon;
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-accent-blue/8 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <AnimatedSection>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 border border-accent-blue/20 flex items-center justify-center mx-auto mb-6">
              <Icon size={28} className="text-accent-cyan" />
            </div>
            <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
              Digital Employee
            </span>
            <h1 className="font-heading text-5xl sm:text-6xl font-bold text-text-primary mt-3 mb-6">
              {data.title}
            </h1>
            <p className="text-text-muted text-xl leading-relaxed max-w-2xl mx-auto mb-8">
              {data.tagline}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25"
            >
              Book a Discovery Call <ArrowRight size={16} />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Overview + Problems */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10">
          <AnimatedSection>
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-5">Overview</h2>
            <p className="text-text-muted leading-relaxed text-lg">{data.overview}</p>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-5">Problems Solved</h2>
            <ul className="space-y-3">
              {data.problems.map((p) => (
                <li key={p} className="flex items-start gap-3 text-text-muted">
                  <CheckCircle2 size={18} className="text-accent-cyan mt-0.5 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface/30">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-heading text-4xl font-bold text-text-primary">Key Features</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.08}>
                <GlassCard className="h-full hover:border-accent-blue/20 transition-colors duration-300">
                  <h3 className="font-heading font-semibold text-text-primary mb-2">{f.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{f.description}</p>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-heading text-4xl font-bold text-text-primary">Business Benefits</h2>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 glass rounded-xl px-5 py-3.5">
                  <CheckCircle2 size={16} className="text-accent-cyan shrink-0" />
                  <span className="text-text-primary text-sm">{b}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 bg-surface/30">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-heading text-4xl font-bold text-text-primary">How It Works</h2>
          </AnimatedSection>
          <div className="space-y-4">
            {data.workflow.map((w, i) => (
              <AnimatedSection key={w.step} delay={i * 0.08}>
                <div className="flex gap-5 glass rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-full bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-blue text-sm font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-text-primary mb-1">{w.step}</h4>
                    <p className="text-text-muted text-sm leading-relaxed">{w.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="font-heading text-4xl font-bold text-text-primary mb-8">Industries Suited</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {data.industries.map((ind) => (
                <span
                  key={ind}
                  className="glass px-5 py-2.5 rounded-full text-sm text-text-primary border border-white/[0.08] hover:border-accent-blue/30 hover:text-accent-cyan transition-all duration-200"
                >
                  {ind}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface/30">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-heading text-4xl font-bold text-text-primary">
              Frequently Asked Questions
            </h2>
          </AnimatedSection>
          <div className="space-y-4">
            {data.faqs.map((faq, i) => (
              <AnimatedSection key={faq.q} delay={i * 0.06}>
                <details className="glass rounded-2xl p-6 group">
                  <summary className="flex items-center justify-between cursor-pointer text-text-primary font-medium font-heading list-none">
                    {faq.q}
                    <ChevronDown size={18} className="text-text-muted group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" />
                  </summary>
                  <p className="text-text-muted text-sm leading-relaxed mt-4">{faq.a}</p>
                </details>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}
