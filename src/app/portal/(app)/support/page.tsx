"use client";

import { useState } from "react";
import { LifeBuoy, CheckCircle2, AlertCircle } from "lucide-react";

const REQUEST_TYPES = [
  "Workflow Modification",
  "New Automation Request",
  "Bug / Error Report",
  "Document Template Change",
  "Email Template Change",
  "Access / Permissions Issue",
  "Data Query",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ type: "", priority: "Medium" as typeof PRIORITIES[number], subject: "", description: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/portal/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const d = await res.json();
      setRefId(d.refId || "");
      setSubmitted(true);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to submit request. Please try again.");
    }
  }

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/40 text-sm focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all";

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <h2 className="font-heading text-xl font-bold text-text-primary">Request Submitted</h2>
        <p className="text-text-muted text-sm">
          Your support request has been received by the Axiploy team. We typically respond within one business day.
        </p>
        <p className="text-xs text-text-muted/50">Reference: {refId}</p>
        <button
          onClick={() => { setSubmitted(false); setRefId(""); setForm({ type: "", priority: "Medium", subject: "", description: "" }); }}
          className="mt-4 px-6 py-2.5 rounded-full glass border border-white/[0.10] hover:border-accent-blue/30 text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Support & Change Requests</h1>
        <p className="text-text-muted text-sm mt-1">
          Request workflow changes, report issues, or ask the Axiploy team for help.
        </p>
      </div>

      <div className="glass rounded-2xl border border-white/[0.08] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
            <LifeBuoy size={18} className="text-accent-blue" />
          </div>
          <div>
            <p className="text-text-primary font-medium text-sm">New Request</p>
            <p className="text-text-muted text-xs">Handled by the Axiploy operations team</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Request Type</label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select type…</option>
                {REQUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      form.priority === p
                        ? p === "Urgent" ? "bg-red-500/20 border-red-500/40 text-red-300"
                          : p === "High" ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : p === "Medium" ? "bg-accent-blue/20 border-accent-blue/40 text-accent-blue"
                          : "bg-white/[0.08] border-white/20 text-text-primary"
                        : "bg-white/[0.03] border-white/[0.06] text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-text-muted text-xs mb-1.5 block">Subject</label>
            <input
              type="text"
              required
              placeholder="Brief description of your request"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-text-muted text-xs mb-1.5 block">Description</label>
            <textarea
              required
              rows={5}
              placeholder="Please provide as much detail as possible — include which Digital Employee is affected, what behaviour you'd like changed, and any examples."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-red-400 text-xs"><AlertCircle size={12} />{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>

      <div className="glass rounded-xl border border-white/[0.06] px-5 py-4">
        <p className="text-text-muted text-xs">
          <span className="text-text-primary font-medium">Typical response time:</span> 1 business day for standard requests, same day for Urgent.
          For emergencies, contact your Axiploy account manager directly.
        </p>
      </div>
    </div>
  );
}
