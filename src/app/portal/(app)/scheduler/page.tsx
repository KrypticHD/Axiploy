"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, X, FolderKanban, Plus } from "lucide-react";
import AssignResourcePanel from "./projects/[id]/AssignResourcePanel";
import type { ProjectTask } from "./projects/[id]/page";
import GanttGrid, { STATUS_COLOR, DAY_MS, type GanttGroup, type GanttDependency } from "./GanttGrid";

interface Project {
  id: string;
  name: string;
  status: string;
}

const WINDOW_DAYS = 28;

export default function SchedulerTimelinePage() {
  const [viewStart, setViewStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 3);
    return d;
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [taskProjectId, setTaskProjectId] = useState<Record<string, string>>({});
  const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

  function toISODate(d: Date): string { return d.toISOString().split("T")[0]; }
  const viewEnd = new Date(viewStart.getTime() + WINDOW_DAYS * DAY_MS);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/portal/scheduler/timeline?from=${toISODate(viewStart)}&to=${toISODate(viewEnd)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setProjects(d.projects || []);
        setTasks(d.tasks || []);
        setDependencies(d.dependencies || []);
        const map: Record<string, string> = {};
        for (const t of d.tasks || []) map[t.id] = t.project_id;
        setTaskProjectId(map);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewStart]);

  useEffect(() => { load(); }, [load]);

  function shiftWindow(deltaDays: number) {
    setViewStart((prev) => new Date(prev.getTime() + deltaDays * DAY_MS));
  }

  function jumpToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 3);
    setViewStart(d);
  }

  async function handleTaskDatesChange(taskId: string, newStart: string, newEnd: string) {
    // Optimistic update so the drag feels instant
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, start_date: newStart, end_date: newEnd } : t)));
    await fetch("/api/portal/scheduler/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, start_date: newStart, end_date: newEnd }),
    });
    load();
  }

  const groups: GanttGroup[] = projects.map((p) => ({
    id: p.id,
    label: p.name,
    href: `/portal/scheduler/projects/${p.id}`,
    tasks: tasks.filter((t) => taskProjectId[t.id] === p.id),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <CalendarDays size={19} className="text-accent-cyan" />
            Portfolio Timeline
          </h1>
          <p className="text-text-muted text-[13px] mt-1">Every project and task across your business, visualised across time.</p>
        </div>
        <Link href="/portal/scheduler/projects/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue hover:bg-accent-blue-light text-white text-[13px] font-medium transition-colors shrink-0">
          <Plus size={14} /> New Project
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => shiftWindow(-14)} className="w-8 h-8 rounded-lg glass border border-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={14} />
        </button>
        <button onClick={jumpToday} className="px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted hover:text-text-primary text-[12px] font-medium transition-colors">
          Today
        </button>
        <button onClick={() => shiftWindow(14)} className="w-8 h-8 rounded-lg glass border border-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <ChevronRight size={14} />
        </button>
        <div className="flex items-center gap-3 ml-4 text-[11px] text-text-muted">
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5 capitalize">
              <span className={`w-2 h-2 rounded-sm ${color}`} /> {status.replace("_", " ")}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-text-muted/50 ml-auto">Drag a bar to move it, drag its edge to resize</p>
      </div>

      {loading ? (
        <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Loading…</p></div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-10 text-center">
          <FolderKanban size={26} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-primary text-sm font-medium">No projects to schedule yet</p>
          <p className="text-text-muted text-[12px] mt-1 mb-4">Create a project and add tasks to see them here.</p>
          <Link href="/portal/scheduler/projects/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[12px] font-medium hover:bg-accent-blue/20 transition-colors">
            <Plus size={12} /> New Project
          </Link>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06]">
          <GanttGrid
            groups={groups}
            dependencies={dependencies}
            viewStart={viewStart}
            windowDays={WINDOW_DAYS}
            onTaskClick={(t) => setActiveTask(tasks.find((pt) => pt.id === t.id) || null)}
            onTaskDatesChange={handleTaskDatesChange}
          />
        </div>
      )}

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
            <AssignResourcePanel task={activeTask} onChange={load} />
          </div>
        </div>
      )}
    </div>
  );
}
