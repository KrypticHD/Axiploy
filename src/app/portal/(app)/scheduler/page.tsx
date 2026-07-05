"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, X, FolderKanban, Plus } from "lucide-react";
import AssignResourcePanel from "./projects/[id]/AssignResourcePanel";
import type { ProjectTask } from "./projects/[id]/page";

interface Project {
  id: string;
  name: string;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  not_started: "bg-white/15",
  in_progress: "bg-accent-blue",
  complete: "bg-emerald-500",
  blocked: "bg-red-500",
};

const DAY_MS = 86400000;
const WINDOW_DAYS = 28;
const DAY_WIDTH = 34;

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

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
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

  const viewEnd = new Date(viewStart.getTime() + WINDOW_DAYS * DAY_MS);
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => new Date(viewStart.getTime() + i * DAY_MS));

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/portal/scheduler/timeline?from=${toISODate(viewStart)}&to=${toISODate(viewEnd)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setProjects(d.projects || []);
        setTasks(d.tasks || []);
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <CalendarDays size={19} className="text-accent-cyan" />
            Timeline
          </h1>
          <p className="text-text-muted text-[13px] mt-1">Every project and task, visualised across time.</p>
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
        <div className="glass rounded-xl border border-white/[0.06] overflow-x-auto">
          <div style={{ minWidth: 200 + WINDOW_DAYS * DAY_WIDTH }}>
            {/* Day header */}
            <div className="flex border-b border-white/[0.06] sticky top-0 bg-surface z-10">
              <div className="w-[200px] shrink-0 px-3 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Project / Task</div>
              {days.map((d) => {
                const isToday = toISODate(d) === toISODate(today);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={d.toISOString()}
                    style={{ width: DAY_WIDTH }}
                    className={`shrink-0 text-center py-2 text-[10px] border-l border-white/[0.04] ${isToday ? "bg-accent-blue/10 text-accent-blue font-semibold" : isWeekend ? "bg-white/[0.02] text-text-muted/40" : "text-text-muted/60"}`}
                  >
                    <div>{d.toLocaleDateString("en-AU", { day: "numeric" })}</div>
                    <div className="text-[9px]">{d.toLocaleDateString("en-AU", { month: "short" })}</div>
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {projects.map((project) => {
              const projectTasks = tasks.filter((t) => taskProjectId[t.id] === project.id);
              return (
                <div key={project.id}>
                  <div className="flex border-b border-white/[0.04] bg-white/[0.015]">
                    <div className="w-[200px] shrink-0 px-3 py-2 text-[12px] font-semibold text-text-primary truncate">
                      <Link href={`/portal/scheduler/projects/${project.id}`} className="hover:text-accent-cyan transition-colors">
                        {project.name}
                      </Link>
                    </div>
                    <div style={{ width: WINDOW_DAYS * DAY_WIDTH }} className="shrink-0" />
                  </div>

                  {projectTasks.length === 0 ? (
                    <div className="flex border-b border-white/[0.04]">
                      <div className="w-[200px] shrink-0 px-3 py-1.5 text-[11px] text-text-muted/40 italic">No tasks</div>
                      <div style={{ width: WINDOW_DAYS * DAY_WIDTH }} className="shrink-0" />
                    </div>
                  ) : (
                    projectTasks.map((task) => {
                      const start = new Date(task.start_date);
                      const end = new Date(task.end_date);
                      const startOffset = Math.max(0, daysBetween(viewStart, start));
                      const endOffset = Math.min(WINDOW_DAYS, daysBetween(viewStart, end) + 1);
                      const span = Math.max(1, endOffset - startOffset);
                      const visible = endOffset > 0 && startOffset < WINDOW_DAYS;

                      return (
                        <div key={task.id} className="flex border-b border-white/[0.04] relative" style={{ height: 34 }}>
                          <div className="w-[200px] shrink-0 px-3 py-2 text-[11px] text-text-muted truncate flex items-center gap-1.5">
                            {task.assignments.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />}
                            {task.name}
                          </div>
                          <div className="relative shrink-0" style={{ width: WINDOW_DAYS * DAY_WIDTH }}>
                            {visible && (
                              <button
                                onClick={() => setActiveTask(task)}
                                style={{ left: startOffset * DAY_WIDTH, width: span * DAY_WIDTH - 4 }}
                                className={`absolute top-1 h-6 rounded-md ${STATUS_COLOR[task.status] || "bg-white/15"} hover:opacity-80 transition-opacity text-left px-2 flex items-center overflow-hidden`}
                              >
                                <span className="text-[10px] text-white font-medium truncate">{task.name}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
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
