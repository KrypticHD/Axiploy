"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/40 text-sm focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all duration-200";

const TICKET_TYPES = [
  "White Card",
  "Working at Heights",
  "Confined Space",
  "First Aid Certificate",
  "Medical Clearance",
  "Drug & Alcohol Test",
  "Site Induction",
  "Right to Work",
];

export default function AddExistingStaffPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

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
      requiredDocs: selectedDocs,
    };
    try {
      const res = await fetch("/api/portal/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSubmitted(true);
      setTimeout(() => router.push("/portal/staff"), 1500);
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
        <h2 className="font-heading text-xl font-bold text-text-primary">Staff member added</h2>
        <p className="text-text-muted text-[13px]">No welcome email was sent — they&apos;re already part of the team.</p>
        <p className="text-text-muted/60 text-xs">Redirecting to the staff directory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/portal/staff" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-[13px] transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Staff Directory
        </Link>
        <h1 className="font-heading text-xl font-bold text-text-primary">Add Existing Staff Member</h1>
        <p className="text-text-muted text-[13px] mt-1">
          For someone already working for you — no welcome email, no onboarding flow. Just adds them to the
          directory so their tickets can be tracked in Site Readiness.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-semibold text-text-primary">Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Full Name *</label>
              <input name="name" type="text" required placeholder="Jane Smith" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Role / Position *</label>
              <input name="role" type="text" required placeholder="Site Operator" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Department</label>
              <input name="department" type="text" placeholder="Operations" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Manager</label>
              <input name="manager" type="text" placeholder="David Chen" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Email</label>
              <input name="email" type="email" placeholder="jane@email.com" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Phone</label>
              <input name="phone" type="tel" placeholder="04XX XXX XXX" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="font-heading font-semibold text-text-primary">Tickets to track (optional)</h2>
          <p className="text-text-muted text-xs">
            Select any tickets you want Site Readiness to track expiry/renewal for. Leave blank to just add them
            to the directory for now.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {TICKET_TYPES.map((doc) => (
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

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-accent-blue hover:bg-accent-blue-light disabled:opacity-60 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25"
        >
          {submitting ? "Saving..." : "Add to Staff Directory"}
        </button>
      </form>
    </div>
  );
}
