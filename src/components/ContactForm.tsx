"use client";

import { useState, FormEvent } from "react";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/50 text-sm focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/30 transition-all duration-200";

  return (
    <div className="glass rounded-2xl p-8">
      <h3 className="font-heading text-xl font-semibold text-text-primary mb-6">
        Send a Message
      </h3>

      {status === "success" && (
        <div className="flex items-start gap-3 bg-accent-cyan/10 border border-accent-cyan/20 rounded-xl p-4 mb-6">
          <CheckCircle2 size={18} className="text-accent-cyan shrink-0 mt-0.5" />
          <div>
            <p className="text-text-primary text-sm font-medium">Message sent successfully!</p>
            <p className="text-text-muted text-sm mt-0.5">We&apos;ll be in touch within one business day.</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-text-muted text-sm">
            Something went wrong. Please try again or email us directly at{" "}
            <a href="mailto:hello@axiploy.com.au" className="text-accent-cyan underline">
              hello@axiploy.com.au
            </a>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-text-muted text-xs mb-1.5 block">Full Name *</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Jane Smith"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1.5 block">Company</label>
            <input
              name="company"
              type="text"
              placeholder="Acme Corp"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Email Address *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="jane@company.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Message *</label>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="Tell us about your business and what you're looking to automate..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-accent-blue hover:bg-accent-blue-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25"
        >
          {status === "loading" ? "Sending..." : "Send Message"}
          {status !== "loading" && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  );
}
