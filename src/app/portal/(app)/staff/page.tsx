"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, ShieldCheck, ShieldAlert, ClipboardList, ChevronRight, Users } from "lucide-react";

interface StaffRow {
  id: string;
  employee_name: string;
  role: string;
  department: string | null;
  status: string;
}

interface ReadinessSummary {
  onboardingId: string;
  overall: "ready" | "action_required" | "not_ready";
}

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [readiness, setReadiness] = useState<Record<string, ReadinessSummary["overall"]>>({});
  const [complianceCounts, setComplianceCounts] = useState<Record<string, number>>({});
  const [incidentCounts, setIncidentCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/staff").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/portal/site-readiness").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/portal/compliance/items").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/portal/safety/incidents").then((r) => (r.ok ? r.json() : null)),
    ]).then(([staffData, readinessData, complianceData, safetyData]) => {
      if (staffData?.staff) setStaff(staffData.staff);

      if (readinessData?.rows) {
        const map: Record<string, ReadinessSummary["overall"]> = {};
        for (const row of readinessData.rows) map[row.onboardingId] = row.overall;
        setReadiness(map);
      }

      if (complianceData?.items) {
        const counts: Record<string, number> = {};
        for (const item of complianceData.items) {
          if (item.staff_id && item.status !== "current" && item.status !== "no_expiry") {
            counts[item.staff_id] = (counts[item.staff_id] || 0) + 1;
          }
        }
        setComplianceCounts(counts);
      }

      if (safetyData?.incidents) {
        const counts: Record<string, number> = {};
        for (const inc of safetyData.incidents) {
          if (inc.staff_id && (inc.status === "new" || inc.status === "investigating")) {
            counts[inc.staff_id] = (counts[inc.staff_id] || 0) + 1;
          }
        }
        setIncidentCounts(counts);
      }
    }).finally(() => setLoading(false));
  }, []);

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.employee_name.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <Users size={19} className="text-accent-cyan" />
            Staff Directory
          </h1>
          <p className="text-text-muted text-[13px] mt-1">
            Every worker, and their site readiness, compliance, and safety status in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/portal/staff/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-text-primary text-[13px] font-medium transition-colors">
            <Plus size={14} /> Add Existing Staff
          </Link>
          <Link href="/portal/forms/new-employee" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue hover:bg-accent-blue-light text-white text-[13px] font-medium transition-colors">
            <Plus size={14} /> New Hire
          </Link>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search name, role, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent-blue/40 transition-colors"
        />
      </div>

      {loading ? (
        <div className="glass rounded-xl border border-white/[0.06] p-8 text-center">
          <p className="text-text-muted text-[13px]">Loading…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-10 text-center">
          <Users size={26} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-primary text-sm font-medium">No staff yet</p>
          <p className="text-text-muted text-[12px] mt-1">Add an existing team member or start onboarding a new hire.</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
          {filtered.map((s) => {
            const ready = readiness[s.id];
            const complianceCount = complianceCounts[s.id] || 0;
            const incidentCount = incidentCounts[s.id] || 0;
            return (
              <Link
                key={s.id}
                href={`/portal/staff/${s.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary text-[13px] font-medium truncate">{s.employee_name}</p>
                  <p className="text-text-muted text-[11px] truncate mt-0.5">
                    {s.role}{s.department ? ` · ${s.department}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5" title="Site readiness">
                    {ready === "ready" ? <ShieldCheck size={14} className="text-emerald-400" /> : ready ? <ShieldAlert size={14} className="text-amber-400" /> : <ShieldCheck size={14} className="text-text-muted/30" />}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-[54px]" title="Open compliance items">
                    <ClipboardList size={13} className={complianceCount > 0 ? "text-amber-400" : "text-text-muted/30"} />
                    <span className={`text-[11px] ${complianceCount > 0 ? "text-amber-400" : "text-text-muted/40"}`}>{complianceCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-[54px]" title="Open safety incidents">
                    <ShieldAlert size={13} className={incidentCount > 0 ? "text-red-400" : "text-text-muted/30"} />
                    <span className={`text-[11px] ${incidentCount > 0 ? "text-red-400" : "text-text-muted/40"}`}>{incidentCount}</span>
                  </div>
                  <ChevronRight size={14} className="text-text-muted/40" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
