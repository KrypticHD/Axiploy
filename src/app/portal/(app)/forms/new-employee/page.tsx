"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/40 text-sm focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all duration-200";

const REQUIRED_DOCS = [
  "Signed Employment Contract",
  "Tax File Number Declaration",
  "Right to Work Evidence",
  "Bank Details Form",
  "Emergency Contact Form",
  "Safety Induction Certificate",
  "Superannuation Choice Form",
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>(REQUIRED_DOCS.slice(0, 4));

  function toggleDoc(doc: string) {
    setSelectedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      role: data.get("role"),
      department: data.get("department"),
      manager: data.get("manager"),
      startDate: data.get("startDate"),
      notes: data.get("notes"),
      requiredDocs: selectedDocs,
    };
    try {
      const res = await fetch("/api/portal/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSubmitted(true);
      setTimeout(() => router.push("/portal/onboarding"), 2000);
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
        <h2 className="font-heading text-xl font-bold text-text-primary">Employee Added</h2>
        <p className="text-text-muted text-[13px]">The AI Onboarding Assistant has been notified and will send the welcome email shortly.</p>
        <p className="text-text-muted/60 text-xs">Redirecting to onboarding dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/portal/onboarding" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-[13px] transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Onboarding
        </Link>
        <h1 className="font-heading text-xl font-bold text-text-primary">Add New Employee</h1>
        <p className="text-text-muted text-[13px] mt-1">
          Submit this form to start the onboarding process. The AI Onboarding Assistant will handle the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-semibold text-text-primary">Employee Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Full Name *</label>
              <input name="name" type="text" required placeholder="Jane Smith" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Email Address *</label>
              <input name="email" type="email" required placeholder="jane@email.com" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Phone Number</label>
              <input name="phone" type="tel" placeholder="04XX XXX XXX" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Role / Position *</label>
              <input name="role" type="text" required placeholder="Site Engineer" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Department</label>
              <input name="department" type="text" placeholder="Engineering" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Manager *</label>
              <input name="manager" type="text" required placeholder="David Chen" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-text-muted text-xs mb-1.5 block">Start Date *</label>
              <input name="startDate" type="date" required className={inputClass} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-semibold text-text-primary">Required Documents</h2>
          <p className="text-text-muted text-xs">Select the documents required from this employee.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {REQUIRED_DOCS.map((doc) => (
              <label key={doc} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors">
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(doc)}
                  onChange={() => toggleDoc(doc)}
                  className="w-3.5 h-3.5 rounded accent-accent-blue"
                />
                <span className="text-text-primary text-xs">{doc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-5 space-y-3">
          <h2 className="font-heading font-semibold text-text-primary">Notes</h2>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any additional notes for the onboarding process..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-accent-blue hover:bg-accent-blue-light disabled:opacity-60 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25"
        >
          {submitting ? "Saving..." : "Add Employee & Start Onboarding"}
        </button>
      </form>
    </div>
  );
}
