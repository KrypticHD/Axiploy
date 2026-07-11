"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusPill from "@/components/portal/StatusPill";
import AgentAvatar from "@/components/portal/AgentAvatar";
import {
  ArrowLeft, ShieldCheck, ClipboardList, ShieldAlert, User, CheckCircle2,
  XCircle, Send, AlertTriangle, MapPin, Clock,
} from "lucide-react";

interface TicketCell {
  documentId: string;
  name: string;
  status: "ready" | "needs_review" | "missing" | "expiring" | "expired";
  expiryDate: string | null;
}

interface Readiness {
  employeeName: string;
  role: string;
  overall: "ready" | "action_required" | "not_ready";
  tickets: TicketCell[];
}

interface StaffDetail {
  id: string;
  employee_name: string;
  role: string;
  department: string | null;
  manager: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  site_id: string | null;
}

interface ComplianceItem {
  id: string;
  title: string;
  category: string;
  expiry_date: string | null;
  status: string;
}

interface SafetyIncident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  created_at: string;
  ai_summary: string | null;
}

type ReadinessStatus =
  | "not_started" | "awaiting_worker" | "under_review" | "action_required"
  | "awaiting_internal_approval" | "awaiting_external_approval" | "ready"
  | "expiring_soon" | "expired" | "blocked";

interface RequirementIssue {
  requirementId: string;
  requirementName: string;
  category: string;
  reason: string;
  status: ReadinessStatus;
}

interface CanonicalReadiness {
  status: ReadinessStatus;
  isReady: boolean;
  blockers: RequirementIssue[];
  warnings: RequirementIssue[];
  expiringSoon: RequirementIssue[];
  requirementCount: number;
  completedCount: number;
}

interface WorkerRequirement {
  id: string;
  internal_approval_status: string;
  external_approval_status: string;
  waived: boolean;
  waived_reason: string | null;
  requirement_templates: { id: string; name: string; category: string; mandatory: boolean; external_approval_required: boolean } | null;
  documents: { name: string; file_url: string | null; received: boolean; validation_status: string | null; validation_notes: string | null; expiry_date: string | null } | null;
}

interface Site { id: string; name: string; }

const TICKET_DOT: Record<string, string> = {
  ready: "bg-emerald-400", expiring: "bg-amber-400", expired: "bg-red-400",
  needs_review: "bg-accent-cyan", missing: "bg-white/20",
};

// Plain, customer-facing labels — never expose internal state names.
const PLAIN_LABEL: Record<ReadinessStatus, string> = {
  not_started: "Not started",
  awaiting_worker: "Missing",
  under_review: "Awaiting review",
  action_required: "Action required",
  awaiting_internal_approval: "Awaiting review",
  awaiting_external_approval: "Awaiting client approval",
  ready: "Ready",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  blocked: "Action required",
};

const STATUS_COLOR: Record<ReadinessStatus, string> = {
  not_started: "text-text-muted bg-white/[0.04] border-white/[0.08]",
  awaiting_worker: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  under_review: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  action_required: "text-red-400 bg-red-500/10 border-red-500/20",
  awaiting_internal_approval: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  awaiting_external_approval: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  ready: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  expiring_soon: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  expired: "text-red-400 bg-red-500/10 border-red-500/20",
  blocked: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function StaffDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [canonical, setCanonical] = useState<CanonicalReadiness | null>(null);
  const [workerRequirements, setWorkerRequirements] = useState<WorkerRequirement[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function load() {
    fetch(`/api/portal/staff/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setStaff(d.staff);
        setReadiness(d.readiness);
        setComplianceItems(d.complianceItems || []);
        setIncidents(d.incidents || []);
        setCanonical(d.canonicalReadiness || null);
        setWorkerRequirements(d.workerRequirements || []);
        setSites(d.sites || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function assignSite(siteId: string) {
    await fetch(`/api/portal/onboarding/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: siteId || null }),
    });
    load();
  }

  async function requirementAction(reqId: string, action: string, extra?: Record<string, string>) {
    await fetch("/api/portal/worker-requirements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reqId, action, ...extra }),
    });
    setRejectingId(null);
    setRejectReason("");
    load();
  }

  if (loading) {
    return <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Loading…</p></div>;
  }

  if (!staff) {
    return <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Staff member not found.</p></div>;
  }

  const pct = canonical && canonical.requirementCount > 0 ? Math.round((canonical.completedCount / canonical.requirementCount) * 100) : null;

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/portal/staff" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-[13px] transition-colors">
        <ArrowLeft size={14} /> Back to Staff Directory
      </Link>

      <div className="glass rounded-xl border border-white/[0.06] p-5 flex items-center gap-4">
        <AgentAvatar type="onboarding" size={44} />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg font-bold text-text-primary">{staff.employee_name}</h1>
          <p className="text-text-muted text-[13px]">
            {staff.role}{staff.department ? ` · ${staff.department}` : ""}{staff.manager ? ` · Manager: ${staff.manager}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <MapPin size={13} className="text-text-muted/50" />
          <select
            value={staff.site_id || ""}
            onChange={(e) => assignSite(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-2 py-1.5 text-[12px] text-text-primary focus:outline-none"
          >
            <option value="">No site assigned</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <StatusPill status={staff.status} size="sm" />
      </div>

      {/* Canonical worker readiness — the single source of truth */}
      {canonical && (
        <div className={`glass rounded-xl border p-5 ${STATUS_COLOR[canonical.status].split(" ").find((c) => c.startsWith("border"))}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className={`text-[13px] font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[canonical.status]}`}>
                {PLAIN_LABEL[canonical.status]}
              </span>
              {pct !== null && <span className="text-[12px] text-text-muted">{canonical.completedCount} of {canonical.requirementCount} requirements complete ({pct}%)</span>}
            </div>
          </div>

          {canonical.requirementCount === 0 ? (
            <p className="text-[12px] text-text-muted">
              No requirements resolved yet — assign this worker to a site to build their checklist, or add role-wide requirement templates.
            </p>
          ) : (
            <>
              {canonical.blockers.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {canonical.blockers.map((b) => (
                    <p key={b.requirementId} className="text-[12px] text-red-400 flex items-start gap-1.5">
                      <XCircle size={12} className="mt-0.5 shrink-0" /> <strong>{b.requirementName}</strong>: {b.reason}
                    </p>
                  ))}
                </div>
              )}
              {canonical.warnings.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {canonical.warnings.map((w) => (
                    <p key={w.requirementId} className="text-[12px] text-accent-cyan flex items-start gap-1.5">
                      <Clock size={12} className="mt-0.5 shrink-0" /> <strong>{w.requirementName}</strong>: {w.reason}
                    </p>
                  ))}
                </div>
              )}
              {canonical.expiringSoon.length > 0 && (
                <div className="space-y-1.5">
                  {canonical.expiringSoon.map((w) => (
                    <p key={w.requirementId} className="text-[12px] text-amber-400 flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" /> <strong>{w.requirementName}</strong>: {w.reason}
                    </p>
                  ))}
                </div>
              )}
              {canonical.isReady && canonical.blockers.length === 0 && canonical.warnings.length === 0 && canonical.expiringSoon.length === 0 && (
                <p className="text-[12px] text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={13} /> Ready to mobilise — no outstanding requirements.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Requirement checklist with approval actions */}
      {workerRequirements.length > 0 && (
        <div>
          <h2 className="font-heading text-[15px] font-semibold text-text-primary mb-2">Requirement Checklist</h2>
          <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
            {workerRequirements.map((wr) => {
              const t = wr.requirement_templates;
              const doc = wr.documents;
              if (!t) return null;
              return (
                <div key={wr.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] text-text-primary font-medium">{t.name}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {t.category}
                        {wr.waived ? ` · Waived${wr.waived_reason ? `: ${wr.waived_reason}` : ""}` : ""}
                        {doc?.expiry_date ? ` · Expires ${new Date(doc.expiry_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc?.received && wr.internal_approval_status === "pending" && (
                        <>
                          <button onClick={() => requirementAction(wr.id, "internal_approve")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors">
                            <CheckCircle2 size={11} /> Approve
                          </button>
                          <button onClick={() => setRejectingId(wr.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors">
                            <XCircle size={11} /> Reject
                          </button>
                        </>
                      )}
                      {wr.internal_approval_status === "approved" && t.external_approval_required && wr.external_approval_status === "not_submitted" && (
                        <button onClick={() => requirementAction(wr.id, "submit_external")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[11px] font-medium hover:bg-accent-blue/20 transition-colors">
                          <Send size={11} /> Submit to client
                        </button>
                      )}
                      {wr.external_approval_status === "submitted" || wr.external_approval_status === "awaiting_approval" ? (
                        <>
                          <button onClick={() => requirementAction(wr.id, "external_approve")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors">
                            <CheckCircle2 size={11} /> Client approved
                          </button>
                          <button onClick={() => setRejectingId(wr.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors">
                            <XCircle size={11} /> Client rejected
                          </button>
                        </>
                      ) : null}
                      {!wr.waived && (
                        <button onClick={() => requirementAction(wr.id, "waive", { reason: "Manually waived by admin" })} className="text-[11px] text-text-muted hover:text-text-primary transition-colors px-1.5">
                          Waive
                        </button>
                      )}
                    </div>
                  </div>

                  {rejectingId === wr.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-text-primary text-[12px] focus:outline-none focus:border-red-400/40"
                      />
                      <button
                        onClick={() => requirementAction(wr.id, wr.external_approval_status === "submitted" ? "external_reject" : "internal_reject", { reason: rejectReason })}
                        disabled={!rejectReason.trim()}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-medium disabled:opacity-40"
                      >
                        Confirm reject
                      </button>
                      <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="text-text-muted text-[11px]">Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Site readiness ticket matrix (kept — still the live document/expiry view) */}
      <div>
        <h2 className="font-heading text-[15px] font-semibold text-text-primary mb-2 flex items-center gap-2">
          <ShieldCheck size={15} className="text-accent-cyan" /> Uploaded Documents
        </h2>
        {readiness && readiness.tickets.length > 0 ? (
          <div className="glass rounded-xl border border-white/[0.06] p-4 flex flex-wrap gap-3">
            {readiness.tickets.map((t) => (
              <div key={t.documentId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <span className={`w-2 h-2 rounded-full ${TICKET_DOT[t.status]}`} />
                <span className="text-[12px] text-text-primary">{t.name}</span>
                {t.expiryDate && <span className="text-[11px] text-text-muted">{new Date(t.expiryDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl border border-white/[0.06] p-4 text-[12px] text-text-muted">
            No documents uploaded yet.
          </div>
        )}
      </div>

      {/* Compliance items */}
      <div>
        <h2 className="font-heading text-[15px] font-semibold text-text-primary mb-2 flex items-center gap-2">
          <ClipboardList size={15} className="text-amber-400" /> Compliance Items
        </h2>
        {complianceItems.length > 0 ? (
          <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
            {complianceItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-[13px] text-text-primary">{item.title}</p>
                  <p className="text-[11px] text-text-muted">{item.category}</p>
                </div>
                <StatusPill status={item.status} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl border border-white/[0.06] p-4 text-[12px] text-text-muted">
            No compliance items assigned to this staff member.
          </div>
        )}
      </div>

      {/* Safety incidents */}
      <div>
        <h2 className="font-heading text-[15px] font-semibold text-text-primary mb-2 flex items-center gap-2">
          <ShieldAlert size={15} className="text-red-400" /> Safety Incidents
        </h2>
        {incidents.length > 0 ? (
          <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
            {incidents.map((inc) => (
              <div key={inc.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] text-text-primary capitalize">{inc.incident_type.replace("_", " ")}</p>
                  <p className="text-[11px] text-text-muted truncate">{inc.ai_summary}</p>
                </div>
                <StatusPill status={inc.severity} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl border border-white/[0.06] p-4 text-[12px] text-text-muted">
            No safety incidents linked to this staff member.
          </div>
        )}
      </div>

      {(staff.email || staff.phone) && (
        <div className="glass rounded-xl border border-white/[0.06] p-4 flex items-center gap-4 text-[12px] text-text-muted">
          <User size={13} className="text-text-muted/50" />
          {staff.email && <span>{staff.email}</span>}
          {staff.phone && <span>{staff.phone}</span>}
        </div>
      )}
    </div>
  );
}
