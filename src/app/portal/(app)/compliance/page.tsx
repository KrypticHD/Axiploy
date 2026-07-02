"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, AlertTriangle, CheckCircle2, Clock, Trash2, Edit2, X, Check, Loader2, ChevronDown, FileText } from "lucide-react";

interface ComplianceItem {
  id: string;
  title: string;
  category: string;
  description: string | null;
  assigned_to: string | null;
  expiry_date: string | null;
  reminder_days: number[];
  notes: string | null;
  status: string;
  daysUntilExpiry: number | null;
  created_at: string;
}

const CATEGORIES = ["Licence", "Certification", "Insurance", "WHS Policy", "Training", "Registration", "Contract", "Other"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType; dot: string }> = {
  expired:      { label: "Expired",       color: "text-red-400",     bg: "bg-red-500/10",    border: "border-red-500/20",    icon: AlertTriangle, dot: "bg-red-400" },
  critical:     { label: "Critical",      color: "text-red-400",     bg: "bg-red-500/10",    border: "border-red-500/20",    icon: AlertTriangle, dot: "bg-red-400" },
  expiring_soon:{ label: "Expiring Soon", color: "text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: Clock,         dot: "bg-amber-400" },
  current:      { label: "Current",       color: "text-emerald-400", bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon: CheckCircle2,  dot: "bg-emerald-400" },
  no_expiry:    { label: "No Expiry",     color: "text-text-muted",  bg: "bg-white/[0.04]",  border: "border-white/[0.08]",  icon: Shield,        dot: "bg-text-muted/40" },
};

const CATEGORY_ICONS: Record<string, string> = {
  "Licence": "🪪", "Certification": "🎓", "Insurance": "🛡️",
  "WHS Policy": "⚠️", "Training": "📚", "Registration": "📋",
  "Contract": "📄", "Other": "🗂️",
};

function daysLabel(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `${days} days remaining`;
}

const BLANK: Partial<ComplianceItem> = {
  title: "", category: "Licence", description: "", assigned_to: "",
  expiry_date: "", reminder_days: [30, 14, 7], notes: "",
};

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<ComplianceItem>>(BLANK);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ComplianceItem>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/portal/compliance/items");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.title?.trim()) return;
    setSaving(true);
    const res = await fetch("/api/portal/compliance/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.item) {
      setShowAdd(false);
      setForm(BLANK);
      load();
    }
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    const res = await fetch("/api/portal/compliance/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    setSaving(false);
    if (res.ok) { setEditingId(null); load(); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch("/api/portal/compliance/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeletingId(null);
  }

  const filtered = items.filter((i) => {
    if (filter !== "all" && i.status !== filter) return false;
    if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
    return true;
  });

  const expired = items.filter((i) => i.status === "expired").length;
  const critical = items.filter((i) => i.status === "critical").length;
  const expiringSoon = items.filter((i) => i.status === "expiring_soon").length;
  const current = items.filter((i) => i.status === "current" || i.status === "no_expiry").length;
  const total = items.length;
  const score = total > 0 ? Math.round((current / total) * 100) : 100;
  const scoreColor = score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-red-400";

  const usedCategories = [...new Set(items.map((i) => i.category))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Compliance Register</h1>
          <p className="text-text-muted text-sm mt-1">Track licences, certifications, insurance and policies. Get reminded before anything expires.</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm(BLANK); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors">
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-1 glass rounded-2xl p-5 border border-white/[0.06] flex flex-col items-center justify-center text-center">
          <p className={`font-heading text-4xl font-bold ${scoreColor}`}>{score}%</p>
          <p className="text-text-muted text-xs mt-1">Compliance Score</p>
        </div>
        {[
          { label: "Expired", value: expired, status: "expired", color: "text-red-400" },
          { label: "Critical (≤7d)", value: critical, status: "critical", color: "text-red-400" },
          { label: "Expiring Soon", value: expiringSoon, status: "expiring_soon", color: "text-amber-400" },
          { label: "Current", value: current, status: "current", color: "text-emerald-400" },
        ].map((s) => (
          <button key={s.label} onClick={() => setFilter(filter === s.status ? "all" : s.status)}
            className={`glass rounded-2xl p-5 border text-center transition-colors ${filter === s.status ? "border-accent-blue/30 bg-accent-blue/5" : "border-white/[0.06] hover:border-white/[0.12]"}`}>
            <p className={`font-heading text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-text-muted text-xs mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Add item form */}
      {showAdd && (
        <div className="glass rounded-2xl border border-accent-blue/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Add Compliance Item</h2>
            <button onClick={() => setShowAdd(false)} className="text-text-muted/50 hover:text-text-muted transition-colors"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Title *</label>
              <input value={form.title || ""} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Public Liability Insurance"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Category</label>
              <div className="relative">
                <select value={form.category || "Licence"} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c2e] text-white text-sm border border-white/[0.10] focus:outline-none focus:border-accent-blue/40 appearance-none pr-8">
                  {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#1c1c2e] text-white">{c}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/50 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Expiry Date</label>
              <input type="date" value={form.expiry_date || ""} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[#1c1c2e] text-white text-sm border border-white/[0.10] focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Assigned To</label>
              <input value={form.assigned_to || ""} onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))}
                placeholder="e.g. Jane Smith"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted mb-1 block">Description / Notes</label>
              <input value={form.description || ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Annual renewal, policy number ABC123"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleAdd} disabled={saving || !form.title?.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : <><Check size={13} /> Add Item</>}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl glass border border-white/[0.08] text-text-muted text-sm hover:bg-white/[0.06] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === "all" ? "bg-accent-blue/20 text-accent-blue" : "glass border border-white/[0.06] text-text-muted hover:text-text-primary"}`}>
            All ({items.length})
          </button>
          {["expired", "critical", "expiring_soon", "current"].map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = items.filter((i) => i.status === s).length;
            if (count === 0) return null;
            return (
              <button key={s} onClick={() => setFilter(filter === s ? "all" : s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : "glass border border-white/[0.06] text-text-muted hover:text-text-primary"}`}>
                {cfg.label} ({count})
              </button>
            );
          })}
          {usedCategories.length > 1 && (
            <div className="relative ml-auto">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#1c1c2e] text-white text-xs border border-white/[0.10] focus:outline-none appearance-none pr-6">
                <option value="all" className="bg-[#1c1c2e]">All categories</option>
                {usedCategories.map((c) => <option key={c} value={c} className="bg-[#1c1c2e]">{c}</option>)}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/50 pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-text-muted/40" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-14 text-center border border-dashed border-white/[0.08]">
          <Shield size={32} className="text-text-muted/20 mx-auto mb-3" />
          <p className="text-text-primary font-medium text-sm">{items.length === 0 ? "No compliance items yet" : "No items match this filter"}</p>
          <p className="text-text-muted text-xs mt-1 mb-4">
            {items.length === 0 ? "Add your licences, certifications, and insurance policies to stay on top of renewals." : "Try a different filter."}
          </p>
          {items.length === 0 && (
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 transition-colors">
              <Plus size={13} /> Add your first item
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.current;
            const Icon = cfg.icon;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className={`glass rounded-xl border transition-all ${cfg.border} ${item.status === "expired" || item.status === "critical" ? "bg-red-500/[0.02]" : ""}`}>
                {isEditing ? (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={editForm.title || ""} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Title" className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-sm focus:outline-none focus:border-accent-blue/40" />
                      <div className="relative">
                        <select value={editForm.category || ""} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-[#1c1c2e] text-white text-sm border border-white/[0.10] focus:outline-none appearance-none pr-8">
                          {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#1c1c2e]">{c}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/50 pointer-events-none" />
                      </div>
                      <input type="date" value={editForm.expiry_date || ""} onChange={(e) => setEditForm((p) => ({ ...p, expiry_date: e.target.value }))}
                        className="px-3 py-2 rounded-xl bg-[#1c1c2e] text-white text-sm border border-white/[0.10] focus:outline-none focus:border-accent-blue/40" />
                      <input value={editForm.assigned_to || ""} onChange={(e) => setEditForm((p) => ({ ...p, assigned_to: e.target.value }))}
                        placeholder="Assigned to" className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-sm focus:outline-none focus:border-accent-blue/40" />
                      <input value={editForm.description || ""} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description / notes" className="sm:col-span-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.10] text-text-primary text-sm focus:outline-none focus:border-accent-blue/40" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(item.id)} disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue text-white text-xs font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted text-xs hover:bg-white/[0.06] transition-colors"><X size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{CATEGORY_ICONS[item.category] || "🗂️"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-text-primary text-sm font-medium">{item.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                            <Icon size={9} /> {cfg.label}
                          </span>
                          <span className="text-[10px] text-text-muted/50 px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap mt-0.5">
                          {item.expiry_date ? (
                            <p className={`text-xs font-medium ${cfg.color}`}>
                              {new Date(item.expiry_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                              {item.daysUntilExpiry !== null && <span className="text-text-muted/60 font-normal ml-1">· {daysLabel(item.daysUntilExpiry)}</span>}
                            </p>
                          ) : (
                            <p className="text-xs text-text-muted/50">No expiry date</p>
                          )}
                          {item.assigned_to && <p className="text-xs text-text-muted/60">👤 {item.assigned_to}</p>}
                          {item.description && <p className="text-xs text-text-muted/50 truncate max-w-xs">{item.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingId(item.id); setEditForm({ title: item.title, category: item.category, description: item.description || "", assigned_to: item.assigned_to || "", expiry_date: item.expiry_date || "", notes: item.notes || "" }); }}
                          className="p-1.5 rounded-lg text-text-muted/40 hover:text-text-muted hover:bg-white/[0.06] transition-colors" title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg text-text-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30" title="Delete">
                          {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      {items.length > 0 && (
        <div className="glass rounded-xl p-4 border border-white/[0.06] flex items-center gap-3">
          <FileText size={14} className="text-text-muted/50 flex-shrink-0" />
          <p className="text-text-muted text-xs">
            {total} items tracked · Compliance score <span className={scoreColor}>{score}%</span>
            {expired + critical > 0 && <span className="text-red-400"> · {expired + critical} need immediate attention</span>}
            {expiringSoon > 0 && <span className="text-amber-400"> · {expiringSoon} expiring within 30 days</span>}
          </p>
        </div>
      )}
    </div>
  );
}
