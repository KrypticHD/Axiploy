"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Save } from "lucide-react";

const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard", pilotDefault: true },
  { key: "staff", label: "Staff", pilotDefault: true },
  { key: "onboarding", label: "Worker Onboarding", pilotDefault: true },
  { key: "readiness", label: "Worker / Site Readiness", pilotDefault: true },
  { key: "approvals", label: "Approvals", pilotDefault: true },
  { key: "scheduler", label: "Mobilisation Schedule", pilotDefault: true },
  { key: "settings", label: "Settings", pilotDefault: true },
  { key: "support", label: "Support", pilotDefault: true },
  { key: "social", label: "Social Content", pilotDefault: false },
  { key: "admin", label: "Outlook Admin Assistant", pilotDefault: false },
  { key: "ask_axiploy", label: "Ask Axiploy", pilotDefault: false },
  { key: "ai_employees", label: "AI Employees Catalogue", pilotDefault: false },
  { key: "workflow_health", label: "Workflow Health", pilotDefault: false },
  { key: "knowledge_base", label: "Knowledge Base", pilotDefault: false },
];

const PILOT_DEFAULT = ALL_MODULES.filter((m) => m.pilotDefault).map((m) => m.key);

const ENFORCEMENT_MODES = [
  { value: "warning_only", label: "Warning only" },
  { value: "manager_override", label: "Manager override" },
  { value: "hard_block", label: "Hard block" },
];

export default function ModuleAccessManager({ clientId }: { clientId: string }) {
  const [enabled, setEnabled] = useState<string[] | null>(null); // null = everything (legacy)
  const [mode, setMode] = useState("manager_override");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}/modules`)
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d.enabledModules);
        setMode(d.schedulingEnforcementMode || "manager_override");
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  function toggle(key: string) {
    setSaved(false);
    setEnabled((prev) => {
      const current = prev ?? PILOT_DEFAULT; // switching off "show everything" starts from the pilot default
      return current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    });
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/clients/${clientId}/modules`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabledModules: enabled, schedulingEnforcementMode: mode }),
    });
    setSaving(false);
    setSaved(true);
  }

  if (loading) return <div className="glass rounded-2xl p-5 text-sm text-text-muted">Loading module access…</div>;

  const isEverything = enabled === null;

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-text-primary flex items-center gap-2">
          <LayoutGrid size={16} className="text-accent-cyan" /> Module Access
        </h2>
        <button
          onClick={() => { setEnabled(PILOT_DEFAULT); setSaved(false); }}
          className="text-xs text-accent-cyan hover:underline"
        >
          Reset to pilot default
        </button>
      </div>

      {isEverything && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          No module list is set — this client currently sees every screen (legacy default). Toggling any module below switches them to an explicit allowlist starting from the pilot default.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {ALL_MODULES.map((m) => {
          const isOn = isEverything ? true : (enabled || []).includes(m.key);
          return (
            <label key={m.key} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer px-2 py-1.5 rounded-lg hover:bg-white/[0.03]">
              <input type="checkbox" checked={isOn} onChange={() => toggle(m.key)} className="w-3.5 h-3.5 rounded accent-accent-blue" />
              {m.label}
            </label>
          );
        })}
      </div>

      <div className="pt-2 border-t border-white/[0.06]">
        <p className="text-xs text-text-muted mb-2">Scheduling enforcement mode</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {ENFORCEMENT_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setSaved(false); }}
              className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${mode === m.value ? "border-accent-blue/40 bg-accent-blue/[0.06] text-accent-blue" : "border-white/[0.06] text-text-muted hover:border-white/[0.12]"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <Save size={14} /> {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
      </button>
    </div>
  );
}
