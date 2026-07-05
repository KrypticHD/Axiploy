"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, Link2, Plus, Trash2 } from "lucide-react";
import GanttGrid, { STATUS_COLOR, DAY_MS, type GanttDependency } from "../../GanttGrid";
import AssignResourcePanel from "./AssignResourcePanel";
import type { ProjectTask } from "./page";

const WINDOW_DAYS = 21;
const LINK_LABELS: Record<string, string> = {
  FS: "Finish-to-Start", SS: "Start-to-Start", FF: "Finish-to-Finish", SF: "Start-to-Finish",
};

export default function ProjectTimeline({
  projectId, tasks, dependencies, onChange,
}: {
  projectId: string;
  tasks: ProjectTask[];
  dependencies: GanttDependency[];
  onChange: () => void;
}) {
  const [viewStart, setViewStart] = useState(() => {
    if (tasks.length === 0) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 2);
      return d;
    }
    const earliest = tasks.reduce((a, t) => (new Date(t.start_date) < new Date(a) ? t.start_date : a), tasks[0].start_date);
    const d = new Date(earliest);
    d.setDate(d.getDate() - 2);
    return d;
  });
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [depForm, setDepForm] = useState<{ successorId: string; predecessorId: string; linkType: string; lag: number } | null>(null);
  const [depError, setDepError] = useState("");

  function shiftWindow(delta: number) {
    setViewStart((prev) => new Date(prev.getTime() + delta * DAY_MS));
  }

  async function handleTaskDatesChange(taskId: string, newStart: string, newEnd: string) {
    await fetch("/api/portal/scheduler/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, start_date: newStart, end_date: newEnd }),
    });
    onChange();
  }

  async function submitDependency() {
    if (!depForm) return;
    setDepError("");
    const res = await fetch("/api/portal/scheduler/dependencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        predecessor_task_id: depForm.predecessorId,
        successor_task_id: depForm.successorId,
        link_type: depForm.linkType,
        lag_days: depForm.lag,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDepError(data.error || "Failed to add dependency");
      return;
    }
    setDepForm(null);
    onChange();
  }

  async function removeDependency(id: string) {
    await fetch("/api/portal/scheduler/dependencies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  const group = useMemo(() => [{ id: projectId, label: "Tasks", tasks }], [projectId, tasks]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => shiftWindow(-7)} className="w-8 h-8 rounded-lg glass border border-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => shiftWindow(7)} className="w-8 h-8 rounded-lg glass border border-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <ChevronRight size={14} />
        </button>
        <div className="flex items-center gap-3 ml-2 text-[11px] text-text-muted">
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5 capitalize">
              <span className={`w-2 h-2 rounded-sm ${color}`} /> {status.replace("_", " ")}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-text-muted/50 ml-auto">Drag bars to reschedule — linked tasks shift automatically</p>
      </div>

      {tasks.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-8 text-center">
          <p className="text-text-muted text-[13px]">Add tasks first to see them on the timeline.</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06]">
          <GanttGrid
            groups={group}
            dependencies={dependencies}
            viewStart={viewStart}
            windowDays={WINDOW_DAYS}
            onTaskClick={(t) => setActiveTask(tasks.find((pt) => pt.id === t.id) || null)}
            onTaskDatesChange={handleTaskDatesChange}
            showGroupHeaders={false}
          />
        </div>
      )}

      {/* Dependencies management */}
      <div className="glass rounded-xl border border-white/[0.06] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-text-primary flex items-center gap-1.5"><Link2 size={13} /> Dependencies</p>
          {tasks.length > 1 && !depForm && (
            <button
              onClick={() => setDepForm({ successorId: tasks[1]?.id || tasks[0].id, predecessorId: tasks[0].id, linkType: "FS", lag: 0 })}
              className="inline-flex items-center gap-1.5 text-[12px] text-accent-cyan hover:text-accent-blue transition-colors"
            >
              <Plus size={12} /> Add dependency
            </button>
          )}
        </div>

        {dependencies.length > 0 && (
          <div className="space-y-1.5">
            {dependencies.map((dep) => {
              const pred = tasks.find((t) => t.id === dep.predecessor_task_id);
              const succ = tasks.find((t) => t.id === dep.successor_task_id);
              return (
                <div key={dep.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[12px]">
                  <span className="text-text-primary truncate">{pred?.name || "?"}</span>
                  <span className="text-text-muted/50 shrink-0">{LINK_LABELS[dep.link_type]}</span>
                  <span className="text-text-primary truncate">{succ?.name || "?"}</span>
                  <button onClick={() => removeDependency(dep.id)} className="ml-auto text-text-muted hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {depForm && (
          <div className="rounded-lg border border-accent-blue/20 bg-accent-blue/[0.04] p-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-muted block mb-1">Predecessor (comes first)</label>
                <select value={depForm.predecessorId} onChange={(e) => setDepForm({ ...depForm, predecessorId: e.target.value })} className="w-full bg-[#1c1c2e] border border-white/[0.1] rounded-lg px-2 py-1.5 text-[12px] text-text-primary focus:outline-none">
                  {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted block mb-1">Successor (depends on it)</label>
                <select value={depForm.successorId} onChange={(e) => setDepForm({ ...depForm, successorId: e.target.value })} className="w-full bg-[#1c1c2e] border border-white/[0.1] rounded-lg px-2 py-1.5 text-[12px] text-text-primary focus:outline-none">
                  {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-muted block mb-1">Link type</label>
                <select value={depForm.linkType} onChange={(e) => setDepForm({ ...depForm, linkType: e.target.value })} className="w-full bg-[#1c1c2e] border border-white/[0.1] rounded-lg px-2 py-1.5 text-[12px] text-text-primary focus:outline-none">
                  {Object.entries(LINK_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted block mb-1">Lag (days)</label>
                <input type="number" value={depForm.lag} onChange={(e) => setDepForm({ ...depForm, lag: Number(e.target.value) })} className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-2 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-accent-blue/40" />
              </div>
            </div>
            {depError && <p className="text-[11px] text-red-400">{depError}</p>}
            <div className="flex gap-2">
              <button onClick={submitDependency} className="px-3 py-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue-light text-white text-[12px] font-medium transition-colors">Add</button>
              <button onClick={() => { setDepForm(null); setDepError(""); }} className="px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted text-[12px]">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Task detail / assign modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setActiveTask(null)} />
          <div className="relative w-full max-w-md glass rounded-xl border border-white/[0.1] bg-surface/95 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-text-primary">{activeTask.name}</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {new Date(activeTask.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  {" → "}
                  {new Date(activeTask.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </p>
              </div>
              <button onClick={() => setActiveTask(null)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
            </div>
            <AssignResourcePanel task={activeTask} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  );
}
