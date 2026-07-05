"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/40 text-sm focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all duration-200";

export default function NewProjectPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      name: data.get("name"),
      site_location: data.get("site_location"),
      start_date: data.get("start_date"),
      end_date: data.get("end_date"),
      budget: data.get("budget") ? Number(data.get("budget")) : null,
      contact_name: data.get("contact_name"),
      contact_email: data.get("contact_email"),
      contact_phone: data.get("contact_phone"),
      notes: data.get("notes"),
    };
    try {
      const res = await fetch("/api/portal/scheduler/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error("Failed to save");
      setSubmitted(true);
      setTimeout(() => router.push(`/portal/scheduler/projects/${result.project.id}`), 1200);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <h2 className="font-heading text-xl font-bold text-text-primary">Project created</h2>
        <p className="text-text-muted/60 text-xs">Redirecting to project details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/portal/scheduler/projects" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-[13px] transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Projects
        </Link>
        <h1 className="font-heading text-xl font-bold text-text-primary">New Project</h1>
        <p className="text-text-muted text-[13px] mt-1">Set up a job so you can add tasks and assign resources against it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-semibold text-text-primary">Project Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-text-muted text-xs mb-1.5 block">Project Name *</label>
              <input name="name" type="text" required placeholder="Pit 3 Haul Road Upgrade" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-text-muted text-xs mb-1.5 block">Site / Location</label>
              <input name="site_location" type="text" placeholder="Mount Isa Site — Pit 3" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Start Date</label>
              <input name="start_date" type="date" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">End Date</label>
              <input name="end_date" type="date" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Budget (AUD)</label>
              <input name="budget" type="number" min={0} step="0.01" placeholder="150000" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-semibold text-text-primary">Client Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Contact Name</label>
              <input name="contact_name" type="text" placeholder="David Chen" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Contact Phone</label>
              <input name="contact_phone" type="tel" placeholder="04XX XXX XXX" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-text-muted text-xs mb-1.5 block">Contact Email</label>
              <input name="contact_email" type="email" placeholder="david@client.com" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5 space-y-3">
          <h2 className="font-heading font-semibold text-text-primary">Notes</h2>
          <textarea name="notes" rows={3} placeholder="Scope, special requirements, access details..." className={`${inputClass} resize-none`} />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-accent-blue hover:bg-accent-blue-light disabled:opacity-60 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25"
        >
          {submitting ? "Saving..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
