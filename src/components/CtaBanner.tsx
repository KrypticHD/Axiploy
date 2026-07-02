import AnimatedSection from "./AnimatedSection";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="py-28">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection>
          <div className="relative rounded-3xl overflow-hidden glass border border-accent-blue/20 p-12 text-center glow-blue">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-cyan/5 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent" />

            <div className="relative z-10">
              <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
                Get Started
              </span>
              <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mt-3 mb-5">
                Build Your AI Workforce Today
              </h2>
              <p className="text-text-muted text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                Discover how Axiploy can help your business increase capacity, reduce repetitive
                work and unlock the full potential of AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/30 hover:shadow-accent-blue/50"
                >
                  Book a Free Discovery Call
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/#agents"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass border border-white/10 hover:border-white/20 text-text-primary font-medium text-sm transition-all duration-200"
                >
                  View Digital Employees
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
