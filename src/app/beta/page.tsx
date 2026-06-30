"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Users, Zap, Shield, Star } from "lucide-react";

const INDUSTRIES = [
  "Construction & Trades",
  "Labour Hire & Recruitment",
  "Healthcare",
  "Retail & Hospitality",
  "Professional Services",
  "Logistics & Transport",
  "Real Estate",
  "Manufacturing",
  "Education",
  "Other",
];

const perks = [
  { icon: Zap, text: "Free implementation — we set everything up for you" },
  { icon: Users, text: "Direct access to the founders" },
  { icon: Star, text: "Help shape future AI employees" },
  { icon: Shield, text: "Limited to 10 businesses only" },
];

export default function BetaPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      industry: (form.elements.namedItem("industry") as HTMLSelectElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      adminHeadache: (form.elements.namedItem("adminHeadache") as HTMLTextAreaElement).value,
    };
    const res = await fetch("/api/beta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  const inputClass = "w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/25 transition-all duration-200";

  return (
    <div className="min-h-screen bg-base text-white relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-accent-blue/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-accent-cyan/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Logo */}
        <div className="mb-16">
          <Link href="/">
            <Image src="/logo.png" alt="Axiploy" width={140} height={38} className="h-10 w-auto object-contain" />
          </Link>
        </div>

        {submitted ? (
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-white mb-4">You&apos;re on the list.</h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              Thanks for applying. We&apos;ll be in touch personally within 48 hours to get you set up.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 text-accent-cyan text-sm hover:underline">
              Back to Axiploy.com
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — copy */}
            <div className="lg:pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-cyan text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                Beta Partner Programme
              </div>

              <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-6">
                Become an Axiploy<br />
                <span className="bg-gradient-to-r from-accent-blue to-accent-cyan bg-clip-text text-transparent">
                  Beta Partner
                </span>
              </h1>

              <p className="text-white/60 text-lg leading-relaxed mb-10">
                Get early access to AI employees that handle your admin, onboarding, and operations — before we open to the public.
              </p>

              <div className="space-y-4">
                {perks.map((perk) => (
                  <div key={perk.text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-accent-blue/10 border border-accent-blue/15 flex items-center justify-center shrink-0 mt-0.5">
                      <perk.icon size={14} className="text-accent-cyan" />
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed pt-1">{perk.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex -space-x-1.5">
                    {["CB", "MR", "AK"].map((i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan border border-base flex items-center justify-center text-[8px] font-bold text-white">{i[0]}</div>
                    ))}
                  </div>
                  <p className="text-white/50 text-xs">3 of 10 spots filled</p>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-2">
                  <div className="bg-gradient-to-r from-accent-blue to-accent-cyan h-1.5 rounded-full" style={{ width: "30%" }} />
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="glass rounded-3xl p-8 border border-white/[0.08]">
              <h2 className="font-heading text-xl font-semibold text-white mb-6">Apply for early access</h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Full Name</label>
                  <input name="name" type="text" required placeholder="Jane Smith" className={inputClass} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Company</label>
                  <input name="company" type="text" required placeholder="Acme Pty Ltd" className={inputClass} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Industry</label>
                  <select name="industry" required className={inputClass}>
                    <option value="" disabled>Select your industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Work Email</label>
                  <input name="email" type="email" required placeholder="jane@company.com" className={inputClass} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Biggest admin headache right now?</label>
                  <textarea
                    name="adminHeadache"
                    required
                    rows={3}
                    placeholder="e.g. Onboarding new staff takes us 2 weeks and drowns our HR team..."
                    className={inputClass + " resize-none"}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-accent-blue hover:bg-accent-blue-light disabled:opacity-60 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25 mt-2"
                >
                  {loading ? "Submitting..." : "Apply for Beta Access"}
                  {!loading && <ArrowRight size={15} />}
                </button>

                <p className="text-white/30 text-xs text-center pt-1">
                  No commitment. We&apos;ll reach out personally to discuss fit.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
