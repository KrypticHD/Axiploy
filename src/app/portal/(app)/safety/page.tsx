"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/portal/MetricCard";
import StatusPill from "@/components/portal/StatusPill";
import AgentAvatar from "@/components/portal/AgentAvatar";
import {
  ShieldAlert, AlertTriangle, ClipboardList, CalendarClock, Copy, Check,
  ChevronDown, ChevronRight, Plus, CheckCircle2,
} from "lucide-react";

interface Incident {
  id: string;
  reported_by_name: string | null;
  description: string;
  photo_url: string | null;
  location: string | null;
  incident_type: string;
  severity: "low" | "medium" | "high" | "critical";
  notifiable: boolean;
  ai_summary: string | null;
  ai_suggested_actions: string[] | null;
  status: "new" | "investigating" | "resolved" | "closed";
  created_at: string;
}

interface CorrectiveAction {
  id: string;
  incident_id: string;
  description: string;
  assigned_to: string | null;
  due_date: string | null;
  status: "open" | "complete";
}

const SEVERITY_STATUS: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

export default function SafetyPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [openIncidents, setOpenIncidents] = useState(0);
  const [overdueActions, setOverdueActions] = useState(0);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [reportToken, setReportToken] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionForm, setActionForm] = useState<{ incidentId: string; description: string; assignedTo: string; assignedEmail: string; dueDate: string } | null>(null);

  function load() {
    fetch("/api/portal/safety/incidents")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setIncidents(d.incidents || []);
        setActions(d.actions || []);
        setOpenIncidents(d.openIncidents || 0);
        setOverdueActions(d.overdueActions || 0);
        setDaysSince(d.daysSinceLastIncident);
        setReportToken(d.reportToken);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const reportLink = reportToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/report/${reportToken}`
    : null;

  function copyLink() {
    if (!reportLink) return;
    navigator.clipboard.writeText(reportLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submitAction() {
    if (!actionForm || !actionForm.description.trim()) return;
    await fetch("/api/portal/safety/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: actionForm.incidentId,
        description: actionForm.description.trim(),
        assignedTo: actionForm.assignedTo.trim() || null,
        assignedEmail: actionForm.assignedEmail.trim() || null,
        dueDate: actionForm.dueDate || null,
      }),
    });
    setActionForm(null);
    load();
  }

  async function completeAction(id: string) {
    await fetch("/api/portal/safety/actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "complete" }),
    });
    load();
  }

  async function markResolved(id: string) {
    await fetch("/api/portal/safety/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "resolved" }),
    });
    load();
  }

  const actionsByIncident = (incidentId: string) => actions.filter((a) => a.incident_id === incidentId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
          <ShieldAlert size={19} className="text-red-400" />
          Safety Register
        </h1>
        <p className="text-text-muted text-[13px] mt-1">
          Incidents and near-misses reported by workers, classified automatically by AI Safety.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard label="Open Incidents" value={openIncidents} icon={AlertTriangle} accent={openIncidents > 0 ? "amber" : "green"} />
        <MetricCard label="Overdue Actions" value={overdueActions} icon={ClipboardList} accent={overdueActions > 0 ? "red" : "green"} />
        <MetricCard label="Days Since Last Incident" value={daysSince ?? "—"} icon={CalendarClock} accent="cyan" />
      </div>

      {reportLink && (
        <div className="glass rounded-xl border border-white/[0.06] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-text-primary">Public incident report link</p>
            <p className="text-[12px] text-text-muted truncate">{reportLink}</p>
          </div>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg glass border border-white/[0.08] hover:border-white/[0.16] text-text-muted hover:text-text-primary text-[12px] font-medium transition-colors shrink-0"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}

      {/* Incident register */}
      <div>
        <h2 className="font-heading text-[15px] font-semibold text-text-primary mb-3">Incident Register</h2>
        {loading ? (
          <div className="glass rounded-xl border border-white/[0.06] p-8 text-center">
            <p className="text-text-muted text-[13px]">Loading…</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="glass rounded-xl border border-white/[0.06] p-10 text-center">
            <CheckCircle2 size={26} className="text-emerald-400/60 mx-auto mb-3" />
            <p className="text-text-primary text-sm font-medium">No incidents reported</p>
            <p className="text-text-muted text-[12px] mt-1">Share the public report link at site entrances so workers can report safely.</p>
          </div>
        ) : (
          <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
            {incidents.map((incident) => {
              const isOpen = expanded === incident.id;
              const relatedActions = actionsByIncident(incident.id);
              return (
                <div key={incident.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : incident.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <AgentAvatar type="safety" size={26} />
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-[13px] font-medium truncate capitalize">
                        {incident.incident_type.replace("_", " ")}{incident.location ? ` — ${incident.location}` : ""}
                      </p>
                      <p className="text-text-muted text-[11px] truncate mt-0.5">
                        {incident.ai_summary || incident.description}
                      </p>
                    </div>
                    <StatusPill status={SEVERITY_STATUS[incident.severity] || "Medium"} size="sm" />
                    <StatusPill status={incident.status} size="sm" />
                    {isOpen ? <ChevronDown size={14} className="text-text-muted/50" /> : <ChevronRight size={14} className="text-text-muted/50" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4">
                      <div className="glass rounded-lg border border-white/[0.06] p-3.5 mb-3">
                        <p className="text-[12px] text-text-muted leading-relaxed whitespace-pre-wrap">
                          {incident.ai_summary || incident.description}
                        </p>
                        {incident.reported_by_name && (
                          <p className="text-[11px] text-text-muted/60 mt-2">Reported by {incident.reported_by_name}</p>
                        )}
                      </div>

                      {incident.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={incident.photo_url} alt="Incident" className="rounded-lg border border-white/[0.08] max-h-56 object-cover mb-3" />
                      )}

                      {relatedActions.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {relatedActions.map((a) => (
                            <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.status === "complete" ? "bg-emerald-400" : "bg-amber-400"}`} />
                              <p className={`text-[12px] flex-1 ${a.status === "complete" ? "text-text-muted line-through" : "text-text-primary"}`}>
                                {a.description}
                              </p>
                              {a.assigned_to && <span className="text-[11px] text-text-muted shrink-0">{a.assigned_to}</span>}
                              {a.status === "open" && (
                                <button onClick={() => completeAction(a.id)} className="text-[11px] text-emerald-400 font-medium shrink-0">
                                  Mark complete
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {actionForm?.incidentId === incident.id ? (
                        <div className="glass rounded-lg border border-white/[0.08] p-3 space-y-2">
                          <input
                            type="text" placeholder="What needs to happen?"
                            value={actionForm.description}
                            onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-accent-blue/50"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text" placeholder="Assigned to"
                              value={actionForm.assignedTo}
                              onChange={(e) => setActionForm({ ...actionForm, assignedTo: e.target.value })}
                              className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-accent-blue/50"
                            />
                            <input
                              type="email" placeholder="Email (optional)"
                              value={actionForm.assignedEmail}
                              onChange={(e) => setActionForm({ ...actionForm, assignedEmail: e.target.value })}
                              className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-accent-blue/50"
                            />
                            <input
                              type="date"
                              value={actionForm.dueDate}
                              onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
                              className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-accent-blue/50 [color-scheme:dark]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={submitAction} className="px-3 py-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue-light text-white text-[12px] font-medium">
                              Assign
                            </button>
                            <button onClick={() => setActionForm(null)} className="px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted text-[12px]">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActionForm({ incidentId: incident.id, description: "", assignedTo: "", assignedEmail: "", dueDate: "" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/[0.08] hover:border-white/[0.16] text-text-muted hover:text-text-primary text-[12px] font-medium transition-colors"
                          >
                            <Plus size={12} /> Add corrective action
                          </button>
                          {incident.status !== "resolved" && incident.status !== "closed" && (
                            <button
                              onClick={() => markResolved(incident.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-medium hover:bg-emerald-500/20 transition-colors"
                            >
                              <CheckCircle2 size={12} /> Mark resolved
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
