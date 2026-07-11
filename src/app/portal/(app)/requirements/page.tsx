"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Plus, X, Check, Trash2, MapPin } from "lucide-react";

interface Site { id: string; name: string; }

interface Template {
  id: string;
  site_id: string | null;
  siteName: string | null;
  role: string | null;
  name: string;
  category: string;
  mandatory: boolean;
  expiry_required: boolean;
  internal_approval_required: boolean;
  external_approval_required: boolean;
  reminder_lead_days: number;
  active: boolean;
}

const CATEGORIES = ["Trade Certificate", "Licence", "Safety Ticket", "Medical", "Induction", "Policy", "Screening", "Other"];

const BLANK = {
  site_id: "", role: "", name: "", category: "Safety Ticket",
  mandatory: true, expiry_required: true, internal_approval_required: true,
  external_approval_required: false, reminder_lead_days: 14,
};

const ENFORCEMENT_MODES = [
  { value: "warning_only", label: "Warning only", desc: "Allocation proceeds; clear readiness warnings are shown." },
  { value: "manager_override", label: "Manager override", desc: "A manager must confirm with a reason to schedule a not-ready worker." },
  { value: "hard_block", label: "Hard block", desc: "Not-ready workers cannot be scheduled at all." },
];

export default function RequirementsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [enforcementMode, setEnforcementMode] = useState("manager_override");

  function load() {
    Promise.all([
      fetch("/api/portal/requirement-templates").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/portal/sites").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/portal/scheduling-settings").then((r) => (r.ok ? r.json() : null)),
    ]).then(([t, s, m]) => {
      if (t?.templates) setTemplates(t.templates);
      if (s?.sites) setSites(s.sites);
      if (m?.mode) setEnforcementMode(m.mode);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function changeEnforcementMode(mode: string) {
    setEnforcementMode(mode);
    await fetch("/api/portal/scheduling-settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
  }

  async function addSite() {
    if (!newSiteName.trim()) return;
    await fetch("/api/portal/sites", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSiteName.trim() }),
    });
    setNewSiteName("");
    setShowAddSite(false);
    load();
  }

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/portal/requirement-templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, site_id: form.site_id || null, role: form.role || null }),
    });
    setSaving(false);
    setShowAdd(false);
    setForm(BLANK);
    load();
  }

  async function toggleActive(t: Template) {
    await fetch("/api/portal/requirement-templates", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, active: !t.active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/portal/requirement-templates", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardCheck size={19} className="text-accent-cyan" />
            Requirement Templates
          </h1>
          <p className="text-text-muted text-[13px] mt-1">
            Define what&apos;s required per client site and role. Assigning a worker to a site + role
            automatically builds their requirement checklist from these templates.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowAddSite(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass border border-white/[0.08] hover:border-white/[0.16] text-text-muted hover:text-text-primary text-[13px] font-medium transition-colors">
            <MapPin size={13} /> Add Site
          </button>
          <button onClick={() => { setShowAdd(true); setForm(BLANK); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue hover:bg-accent-blue-light text-white text-[13px] font-medium transition-colors">
            <Plus size={14} /> New Requirement
          </button>
        </div>
      </div>

      <div className="glass rounded-xl border border-white/[0.06] p-4">
        <p className="text-[12px] font-semibold text-text-primary mb-2">Scheduling enforcement</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {ENFORCEMENT_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => changeEnforcementMode(m.value)}
              className={`text-left p-3 rounded-lg border transition-colors ${enforcementMode === m.value ? "border-accent-blue/40 bg-accent-blue/[0.06]" : "border-white/[0.06] hover:border-white/[0.12]"}`}
            >
              <p className={`text-[12px] font-medium ${enforcementMode === m.value ? "text-accent-blue" : "text-text-primary"}`}>{m.label}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {showAddSite && (
        <div className="glass rounded-xl border border-accent-blue/20 p-4 flex items-center gap-2">
          <input
            value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSite()}
            placeholder="Site name, e.g. KCGM"
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.1] text-text-primary text-[13px] focus:outline-none focus:border-accent-blue/40"
          />
          <button onClick={addSite} className="px-3 py-2 rounded-lg bg-accent-blue text-white text-[12px] font-medium">Add</button>
          <button onClick={() => setShowAddSite(false)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>
      )}

      {showAdd && (
        <div className="glass rounded-xl border border-accent-blue/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-text-primary">New Requirement Template</h2>
            <button onClick={() => setShowAdd(false)} className="text-text-muted/50 hover:text-text-muted"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted mb-1 block">Requirement Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Working at Heights" className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-[13px] focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#1c1c2e] text-white text-[13px] border border-white/[0.10] focus:outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Applies to Site</label>
              <select value={form.site_id} onChange={(e) => setForm((p) => ({ ...p, site_id: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#1c1c2e] text-white text-[13px] border border-white/[0.10] focus:outline-none">
                <option value="">All sites</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted mb-1 block">Applies to Role (leave blank for all roles)</label>
              <input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="Boilermaker" className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-[13px] focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Reminder lead time (days)</label>
              <input type="number" min={0} value={form.reminder_lead_days} onChange={(e) => setForm((p) => ({ ...p, reminder_lead_days: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-[13px] focus:outline-none focus:border-accent-blue/40" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {[
              { key: "mandatory" as const, label: "Mandatory" },
              { key: "expiry_required" as const, label: "Has expiry" },
              { key: "internal_approval_required" as const, label: "Needs internal approval" },
              { key: "external_approval_required" as const, label: "Needs client/site approval" },
            ].map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-[12px] text-text-muted cursor-pointer">
                <input type="checkbox" checked={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.checked }))} className="w-3.5 h-3.5 rounded accent-accent-blue" />
                {f.label}
              </label>
            ))}
          </div>

          <button onClick={handleAdd} disabled={saving || !form.name.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue text-white text-[13px] font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
            {saving ? "Saving..." : <><Check size={13} /> Add Requirement</>}
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Loading…</p></div>
      ) : templates.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-10 text-center">
          <ClipboardCheck size={26} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-primary text-sm font-medium">No requirement templates yet</p>
          <p className="text-text-muted text-[12px] mt-1">Add one above — e.g. Working at Heights for Boilermakers at KCGM.</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
          {templates.map((t) => (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${!t.active ? "opacity-40" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary text-[13px] font-medium">{t.name}</p>
                <p className="text-text-muted text-[11px] mt-0.5">
                  {t.category} · {t.siteName || "All sites"} · {t.role || "All roles"}
                  {t.mandatory ? " · Mandatory" : " · Optional"}
                  {t.external_approval_required ? " · Client approval" : ""}
                </p>
              </div>
              <button onClick={() => toggleActive(t)} className="text-[11px] text-text-muted hover:text-text-primary transition-colors shrink-0">
                {t.active ? "Active" : "Inactive"}
              </button>
              <button onClick={() => handleDelete(t.id)} className="text-text-muted hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
