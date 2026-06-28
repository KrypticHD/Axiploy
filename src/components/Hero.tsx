"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent-blue/10 blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-accent-cyan/8 blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-text-muted mb-8 border border-accent-blue/20"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          The Future of Work is Here
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-text-primary mb-6"
        >
          Deploy AI Employees That{" "}
          <span className="gradient-text">Work Alongside</span>{" "}
          Your Team
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Helping businesses reduce administration, improve efficiency and scale operations
          through intelligent AI-powered digital employees.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40"
          >
            Book a Free Discovery Call
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full glass border border-white/10 hover:border-white/20 text-text-primary font-medium text-sm transition-all duration-200"
          >
            <Play size={14} className="text-accent-cyan" />
            Explore Digital Employees
          </Link>
        </motion.div>

        {/* Hero logo visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-20 mx-auto max-w-md"
        >
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-accent-blue/20 to-accent-cyan/20 blur-2xl animate-pulse" />
            {/* Logo container */}
            <div className="relative glass rounded-3xl p-8 glow-border">
              <Image
                src="/logo.png"
                alt="Axiploy"
                width={280}
                height={120}
                className="w-full h-auto object-contain rounded-xl"
                priority
              />
              {/* Floating stats */}
              <div className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 text-xs">
                <span className="text-accent-cyan font-semibold">↑ 40%</span>
                <span className="text-text-muted ml-1">Efficiency</span>
              </div>
              <div className="absolute -bottom-4 -left-4 glass rounded-xl px-3 py-2 text-xs">
                <span className="text-accent-blue font-semibold">300+</span>
                <span className="text-text-muted ml-1">Hours saved/mo</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Industry trust bar */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-text-muted text-sm mt-16"
        >
          Trusted across{" "}
          <span className="text-text-primary">Mining · Construction · Recruitment · Engineering · Property</span>
        </motion.p>
      </div>
    </section>
  );
}
