"use client";

import { useState } from "react";
import StatusPill from "@/components/portal/StatusPill";
import { Plus, X, Check, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { ProjectTask } from "./page";
import AssignResourcePanel from "./AssignResourcePanel";

const STATUS_OPTIONS = ["not_started", "in_progress", "complete", "blocked"];
const BLANK = { name: "", start_date: "", end_date: "", notes: "" };

export default function TaskList({
  projectId, projectStart, projectEnd, tasks, onChange,
}: {
  projectId: string;
  projectStart: string | null;
  projectEnd: string | null;
  tasks: ProjectTask[];
  onChange: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...BLANK, start_date: projectStart || "", end_date: projectEnd || "" });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.name.trim() || !form.start_date || !form.end_date) return;
    setSaving(true);
    await fetch("/api/portal/scheduler/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, ...form }),
    });
    setSaving(false);
    setShowAdd(false);
    setForm({ ...BLANK, start_date: projectStart || "", end_date: projectEnd || "" });
    onChange();
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/portal/scheduler/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    onChange();
  }

  async function deleteTask(id: string) {
    await fetch("/api/portal/scheduler/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[12px] font-medium hover:bg-accent-blue/20 transition-colors">
          <Plus size={12} /> Add Task
        </button>
      </div>

      {showAdd && (
        <div className="glass rounded-xl border border-accent-blue/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text-primary">New Task</p>
            <button onClick={() => setShowAdd(false)} className="text-text-muted/50 hover:text-text-muted"><X size={15} /></button>
          </div>
          <input
            value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Task name" className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.1] text-text-primary text-[13px] focus:outline-none focus:border-accent-blue/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-[#1c1c2e] text-white text-[13px] border border-white/[0.1] focus:outline-none focus:border-accent-blue/40 [color-scheme:dark]" />
            <input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-[#1c1c2e] text-white text-[13px] border border-white/[0.1] focus:outline-none focus:border-accent-blue/40 [color-scheme:dark]" />
          </div>
          <button onClick={handleAdd} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue text-white text-[12px] font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
            {saving ? "Saving..." : <><Check size={12} /> Add Task</>}
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-8 text-center">
          <p className="text-text-muted text-[13px]">No tasks yet — add one to start scheduling resources.</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
          {tasks.map((t) => {
            const isOpen = expanded === t.id;
            return (
              <div key={t.id}>
                <button onClick={() => setExpanded(isOpen ? null : t.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary text-[13px] font-medium truncate">{t.name}</p>
                    <p className="text-text-muted text-[11px] mt-0.5">
                      {new Date(t.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      {" → "}
                      {new Date(t.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      {t.assignments.length > 0 ? ` · ${t.assignments.length} assigned` : ""}
                    </p>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) => { e.stopPropagation(); updateStatus(t.id, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-2 py-1 text-[11px] text-text-primary focus:outline-none capitalize"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  <StatusPill status={t.status} size="sm" />
                  {isOpen ? <ChevronDown size={14} className="text-text-muted/50" /> : <ChevronRight size={14} className="text-text-muted/50" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4">
                    <AssignResourcePanel task={t} onChange={onChange} />
                    <button onClick={() => deleteTask(t.id)} className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 size={11} /> Delete task
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
