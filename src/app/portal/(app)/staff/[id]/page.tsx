"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusPill from "@/components/portal/StatusPill";
import AgentAvatar from "@/components/portal/AgentAvatar";
import { ArrowLeft, ShieldCheck, ClipboardList, ShieldAlert, User } from "lucide-react";

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

const TICKET_DOT: Record<string, string> = {
  ready: "bg-emerald-400", expiring: "bg-amber-400", expired: "bg-red-400",
  needs_review: "bg-accent-cyan", missing: "bg-white/20",
};

export default function StaffDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/staff/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setStaff(d.staff);
        setReadiness(d.readiness);
        setComplianceItems(d.complianceItems || []);
        setIncidents(d.incidents || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Loading…</p></div>;
  }

  if (!staff) {
    return <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Staff member not found.</p></div>;
  }

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
        <StatusPill status={staff.status} size="sm" />
      </div>

      {/* Site readiness */}
      <div>
        <h2 className="font-heading text-[15px] font-semibold text-text-primary mb-2 flex items-center gap-2">
          <ShieldCheck size={15} className="text-accent-cyan" /> Site Readiness
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
            No tickets being tracked for this staff member yet.
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
