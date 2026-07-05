"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, FileQuestion, Clock, ArrowRight } from "lucide-react";

interface TicketCell {
  documentId: string;
  name: string;
  status: "ready" | "needs_review" | "missing" | "expiring" | "expired";
  expiryDate: string | null;
  fileUrl: string | null;
}

interface WorkerRow {
  onboardingId: string;
  employeeName: string;
  role: string;
  status: string;
  overall: "ready" | "action_required" | "not_ready";
  tickets: TicketCell[];
}

const CELL_STYLE: Record<TicketCell["status"], { dot: string; label: string }> = {
  ready: { dot: "bg-emerald-400", label: "Valid" },
  expiring: { dot: "bg-amber-400", label: "Expiring soon" },
  expired: { dot: "bg-red-400", label: "Expired" },
  needs_review: { dot: "bg-accent-cyan", label: "Needs review" },
  missing: { dot: "bg-white/20", label: "Not uploaded" },
};

const OVERALL_STYLE: Record<WorkerRow["overall"], { text: string; bg: string; label: string; icon: React.ElementType }> = {
  ready: { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Site ready", icon: CheckCircle2 },
  action_required: { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Action needed", icon: AlertTriangle },
  not_ready: { text: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Not site ready", icon: XCircle },
};

export default function SiteReadinessPage() {
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/site-readiness")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setRows(d.rows || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ticketNames = Array.from(new Set(rows.flatMap((r) => r.tickets.map((t) => t.name))));
  const readyCount = rows.filter((r) => r.overall === "ready").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck size={19} className="text-accent-cyan" />
          Site Readiness
        </h1>
        <p className="text-text-muted text-[13px] mt-1">
          Live ticket status for every worker — AI Onboarding validates uploads and chases renewals automatically.
        </p>
      </div>

      {!loading && rows.length > 0 && (
        <div className="glass rounded-xl border border-white/[0.06] px-5 py-4 flex items-center gap-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            readyCount === rows.length ? "bg-emerald-500/10" : "bg-amber-500/10"
          }`}>
            <ShieldCheck size={17} className={readyCount === rows.length ? "text-emerald-400" : "text-amber-400"} />
          </div>
          <p className="text-[13px] text-text-primary">
            <span className="font-semibold">{readyCount} of {rows.length}</span> workers are site-ready today.
            {readyCount < rows.length && (
              <>
                {" "}<Link href="/portal/inbox" className="text-accent-cyan hover:underline inline-flex items-center gap-1">
                  Review outstanding items <ArrowRight size={11} />
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      {loading ? (
        <div className="glass rounded-xl border border-white/[0.06] p-10 text-center">
          <p className="text-text-muted text-[13px]">Loading roster…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-10 text-center">
          <FileQuestion size={26} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-primary text-sm font-medium">No workers on the roster yet</p>
          <p className="text-text-muted text-[12px] mt-1 mb-4">Add a new employee to start tracking their site-readiness tickets.</p>
          <Link href="/portal/forms/new-employee" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[12px] font-medium hover:bg-accent-blue/20 transition-colors">
            Add worker
          </Link>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06] overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-text-muted text-[11px] font-medium px-4 py-3">Worker</th>
                <th className="text-left text-text-muted text-[11px] font-medium px-3 py-3">Status</th>
                {ticketNames.map((name) => (
                  <th key={name} className="text-center text-text-muted text-[11px] font-medium px-3 py-3 whitespace-nowrap">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const overall = OVERALL_STYLE[r.overall];
                const OverallIcon = overall.icon;
                return (
                  <tr key={r.onboardingId} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-text-primary text-[13px] font-medium">{r.employeeName}</p>
                      <p className="text-text-muted text-[11px]">{r.role}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 border rounded-full px-2 py-0.5 text-[11px] font-medium ${overall.bg} ${overall.text}`}>
                        <OverallIcon size={11} />
                        {overall.label}
                      </span>
                    </td>
                    {ticketNames.map((name) => {
                      const ticket = r.tickets.find((t) => t.name === name);
                      const cellId = `${r.onboardingId}:${name}`;
                      const style = ticket ? CELL_STYLE[ticket.status] : CELL_STYLE.missing;
                      return (
                        <td key={name} className="px-3 py-3 text-center relative">
                          <div
                            className="inline-flex items-center justify-center cursor-default"
                            onMouseEnter={() => setHover(cellId)}
                            onMouseLeave={() => setHover(null)}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                          </div>
                          {hover === cellId && (
                            <div className="absolute z-10 left-1/2 -translate-x-1/2 -top-1 -translate-y-full bg-surface border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary whitespace-nowrap shadow-xl">
                              {ticket ? (
                                <>
                                  <span className="font-medium">{style.label}</span>
                                  {ticket.expiryDate && (
                                    <span className="text-text-muted"> · {new Date(ticket.expiryDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-text-muted">Not required</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-4 text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Valid</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Expiring soon</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Expired</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-cyan" /> Needs review</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> Not uploaded</span>
      </div>

      <p className="text-text-muted/50 text-[11px] flex items-center gap-1.5">
        <Clock size={11} /> Updated live from uploaded documents — Axiploy automatically requests renewals before tickets expire.
      </p>
    </div>
  );
}
