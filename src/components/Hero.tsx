"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroDashboard from "./HeroDashboard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-16">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-accent-blue/8 blur-[140px]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent-cyan/6 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Headline — left aligned, Linear style */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-text-primary max-w-4xl"
        >
          Your AI workforce,
          <br />
          <span className="gradient-text">already working.</span>
        </motion.h1>

        {/* Sub row: subtext left, CTAs right */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
        >
          <p className="text-text-muted text-base sm:text-lg leading-relaxed max-w-xl">
            Axiploy builds AI employees that handle admin, inboxes, onboarding, follow-ups,
            quotes and repetitive business tasks — directly inside your workflow.
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40"
            >
              Book a Demo
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/#agents"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              See AI Employees
              <ArrowRight size={14} className="text-accent-cyan" />
            </Link>
          </div>
        </motion.div>

        {/* Product mockup — the centrepiece */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroDashboard />
        </motion.div>

        {/* Industry trust bar */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="text-text-muted/60 text-sm mt-10 text-center"
        >
          Trusted across{" "}
          <span className="text-text-primary/70">Mining · Construction · Recruitment · Engineering · Property</span>
        </motion.p>
      </div>
    </section>
  );
}
