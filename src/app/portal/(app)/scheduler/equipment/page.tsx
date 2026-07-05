"use client";

import { useEffect, useState } from "react";
import StatusPill from "@/components/portal/StatusPill";
import { Truck, Plus, X, Check, Trash2 } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  type: string | null;
  registration: string | null;
  compliance_expiry: string | null;
  status: string;
}

const BLANK = { name: "", type: "", registration: "", compliance_expiry: "" };

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/portal/scheduler/equipment")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.equipment) setItems(d.equipment); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/portal/scheduler/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowAdd(false);
    setForm(BLANK);
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/portal/scheduler/equipment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <Truck size={19} className="text-accent-cyan" />
            Equipment
          </h1>
          <p className="text-text-muted text-[13px] mt-1">Plant and machinery available to assign to project tasks.</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm(BLANK); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue hover:bg-accent-blue-light text-white text-[13px] font-medium transition-colors shrink-0">
          <Plus size={14} /> Add Equipment
        </button>
      </div>

      {showAdd && (
        <div className="glass rounded-xl border border-accent-blue/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-text-primary">Add Equipment</h2>
            <button onClick={() => setShowAdd(false)} className="text-text-muted/50 hover:text-text-muted transition-colors"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Excavator 3" className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-[13px] focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Type</label>
              <input value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} placeholder="Excavator" className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-[13px] focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Registration</label>
              <input value={form.registration} onChange={(e) => setForm((p) => ({ ...p, registration: e.target.value }))} placeholder="ABC-123" className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-[13px] focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Compliance/Inspection Expiry</label>
              <input type="date" value={form.compliance_expiry} onChange={(e) => setForm((p) => ({ ...p, compliance_expiry: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#1c1c2e] text-white text-[13px] border border-white/[0.10] focus:outline-none focus:border-accent-blue/40 [color-scheme:dark]" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving || !form.name.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue text-white text-[13px] font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
            {saving ? "Saving..." : <><Check size={13} /> Add Equipment</>}
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Loading…</p></div>
      ) : items.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-10 text-center">
          <Truck size={26} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-primary text-sm font-medium">No equipment added yet</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
          {items.map((item) => {
            const expired = item.compliance_expiry ? new Date(item.compliance_expiry) < today : false;
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary text-[13px] font-medium">{item.name}</p>
                  <p className="text-text-muted text-[11px]">{item.type}{item.registration ? ` · ${item.registration}` : ""}</p>
                </div>
                {item.compliance_expiry && (
                  <span className={`text-[11px] ${expired ? "text-red-400" : "text-text-muted"}`}>
                    {expired ? "Expired " : "Expires "}
                    {new Date(item.compliance_expiry).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
                <StatusPill status={item.status} size="sm" />
                <button onClick={() => handleDelete(item.id)} className="text-text-muted hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
