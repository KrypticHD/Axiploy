"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import GanttGrid, { STATUS_COLOR, DAY_MS, DAY_WIDTH, type GanttDependency } from "../../GanttGrid";
import AssignResourcePanel from "./AssignResourcePanel";
import type { ProjectTask } from "./page";

const ROW_HEIGHT = 34;
const HEADER_HEIGHT = 44;
const TABLE_WIDTH = 460;
const VALID_LINKS = ["FS", "SS", "FF", "SF"];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Parses MS Project-style shorthand: "2FS+3d, 4SS-1d, 1" (row number, optional link type, optional lag). */
function parsePredecessorText(text: string): { rowNum: number; linkType: string; lag: number }[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const m = entry.match(/^(\d+)\s*(FS|SS|FF|SF)?\s*([+-]\s*\d+)?d?$/i);
      if (!m) return null;
      return {
        rowNum: parseInt(m[1], 10),
        linkType: (m[2] || "FS").toUpperCase(),
        lag: m[3] ? parseInt(m[3].replace(/\s/g, ""), 10) : 0,
      };
    })
    .filter((x): x is { rowNum: number; linkType: string; lag: number } => !!x && VALID_LINKS.includes(x.linkType));
}

function formatPredecessorText(
  successorId: string,
  deps: GanttDependency[],
  rowNumberOf: Map<string, number>
): string {
  return deps
    .filter((d) => d.successor_task_id === successorId)
    .map((d) => {
      const row = rowNumberOf.get(d.predecessor_task_id);
      if (!row) return null;
      const lag = d.lag_days || 0;
      const lagStr = lag ? (lag > 0 ? `+${lag}d` : `${lag}d`) : "";
      return `${row}${d.link_type}${lagStr}`;
    })
    .filter(Boolean)
    .join(", ");
}

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
  const [newTaskName, setNewTaskName] = useState("");
  const [predText, setPredText] = useState<Record<string, string>>({});
  const [predError, setPredError] = useState<Record<string, string>>({});
  const [windowDays, setWindowDays] = useState(28);
  const ganttRef = useRef<HTMLDivElement>(null);

  // Size the Gantt to fill whatever horizontal space is available
  useEffect(() => {
    const el = ganttRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setWindowDays(Math.max(10, Math.floor(w / DAY_WIDTH)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const orderedTasks = useMemo(() => [...tasks].sort((a, b) => a.start_date.localeCompare(b.start_date)), [tasks]);
  const rowNumberOf = useMemo(() => {
    const m = new Map<string, number>();
    orderedTasks.forEach((t, i) => m.set(t.id, i + 1));
    return m;
  }, [orderedTasks]);

  function shiftWindow(delta: number) {
    setViewStart((prev) => new Date(prev.getTime() + delta * DAY_MS));
  }

  async function updateTaskField(taskId: string, field: "name" | "start_date" | "end_date", value: string) {
    await fetch("/api/portal/scheduler/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, [field]: value }),
    });
    onChange();
  }

  async function handleTaskDatesChange(taskId: string, newStart: string, newEnd: string) {
    await fetch("/api/portal/scheduler/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, start_date: newStart, end_date: newEnd }),
    });
    onChange();
  }

  async function addTask() {
    const name = newTaskName.trim();
    if (!name) return;

    // Default new tasks to the end of the current schedule (or today if empty),
    // so they always land somewhere the user is already looking.
    let start: string;
    if (orderedTasks.length > 0) {
      const latestEnd = orderedTasks.reduce((a, t) => (t.end_date > a ? t.end_date : a), orderedTasks[0].end_date);
      start = toISODate(new Date(new Date(latestEnd).getTime() + DAY_MS));
    } else {
      start = toISODate(new Date());
    }
    const end = toISODate(new Date(new Date(start).getTime() + 2 * DAY_MS));

    // Make sure the new bar is inside the visible window
    const startDate = new Date(start);
    if (startDate < viewStart || startDate > new Date(viewStart.getTime() + windowDays * DAY_MS)) {
      const nv = new Date(startDate);
      nv.setDate(nv.getDate() - 2);
      setViewStart(nv);
    }

    await fetch("/api/portal/scheduler/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, name, start_date: start, end_date: end }),
    });
    setNewTaskName("");
    onChange();
  }

  async function commitPredecessors(task: ProjectTask) {
    const text = predText[task.id];
    if (text === undefined) return; // cell wasn't touched

    const parsed = parsePredecessorText(text);
    const invalidRow = parsed.find((p) => p.rowNum < 1 || p.rowNum > orderedTasks.length || orderedTasks[p.rowNum - 1].id === task.id);
    if (invalidRow) {
      setPredError((p) => ({ ...p, [task.id]: `Row ${invalidRow.rowNum} isn't valid` }));
      return;
    }

    const desired = parsed.map((p) => ({
      predecessorId: orderedTasks[p.rowNum - 1].id,
      linkType: p.linkType,
      lag: p.lag,
    }));

    const current = dependencies.filter((d) => d.successor_task_id === task.id);

    // Remove dependencies no longer present
    for (const dep of current) {
      const stillWanted = desired.find((d) => d.predecessorId === dep.predecessor_task_id && d.linkType === dep.link_type);
      if (!stillWanted) {
        await fetch("/api/portal/scheduler/dependencies", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: dep.id }),
        });
      }
    }

    // Add newly-typed dependencies
    let firstError = "";
    for (const d of desired) {
      const exists = current.find((c) => c.predecessor_task_id === d.predecessorId && c.link_type === d.linkType);
      if (exists) continue;
      const res = await fetch("/api/portal/scheduler/dependencies", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          predecessor_task_id: d.predecessorId,
          successor_task_id: task.id,
          link_type: d.linkType,
          lag_days: d.lag,
        }),
      });
      if (!res.ok && !firstError) {
        const data = await res.json();
        firstError = data.error || "Failed to add dependency";
      }
    }

    setPredError((p) => ({ ...p, [task.id]: firstError }));
    setPredText((p) => { const next = { ...p }; delete next[task.id]; return next; });
    onChange();
  }

  const group = useMemo(() => [{ id: projectId, label: "Tasks", tasks: orderedTasks }], [projectId, orderedTasks]);

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
        <p className="text-[11px] text-text-muted/50 ml-auto">
          Predecessors: row number + link type + lag, e.g. &quot;2FS+3d&quot;
        </p>
      </div>

      <div className="glass rounded-xl border border-white/[0.06] flex overflow-hidden" style={{ minHeight: "calc(100vh - 320px)" }}>
        {/* Left: editable task grid */}
        <div className="shrink-0 border-r border-white/[0.06]" style={{ width: TABLE_WIDTH }}>
          <div className="flex border-b border-white/[0.06] bg-surface" style={{ height: HEADER_HEIGHT }}>
            <div className="w-8 shrink-0 flex items-center justify-center text-[10px] text-text-muted/50">#</div>
            <div className="flex-1 min-w-0 px-2 flex items-center text-[11px] font-semibold text-text-muted uppercase tracking-wide">Name</div>
            <div className="w-[92px] shrink-0 px-1 flex items-center text-[11px] font-semibold text-text-muted uppercase tracking-wide">Start</div>
            <div className="w-[92px] shrink-0 px-1 flex items-center text-[11px] font-semibold text-text-muted uppercase tracking-wide">Finish</div>
            <div className="w-[110px] shrink-0 px-1 flex items-center text-[11px] font-semibold text-text-muted uppercase tracking-wide">Predecessors</div>
          </div>

          {orderedTasks.map((task) => {
            const row = rowNumberOf.get(task.id)!;
            const value = predText[task.id] !== undefined ? predText[task.id] : formatPredecessorText(task.id, dependencies, rowNumberOf);
            const error = predError[task.id];
            return (
              <div key={task.id} className="border-b border-white/[0.04]" style={{ height: ROW_HEIGHT }}>
                <div className="flex items-center h-full">
                  <div className="w-8 shrink-0 flex items-center justify-center text-[11px] text-text-muted/50">{row}</div>
                  <input
                    defaultValue={task.name}
                    onBlur={(e) => e.target.value !== task.name && updateTaskField(task.id, "name", e.target.value)}
                    onClick={() => setActiveTask(task)}
                    className="flex-1 min-w-0 px-2 py-1 bg-transparent text-[12px] text-text-primary focus:outline-none focus:bg-white/[0.03] truncate"
                  />
                  <input
                    key={`start:${task.id}:${task.start_date}`}
                    type="date"
                    defaultValue={task.start_date}
                    onBlur={(e) => e.target.value && e.target.value !== task.start_date && updateTaskField(task.id, "start_date", e.target.value)}
                    className="w-[92px] shrink-0 px-1 py-1 bg-transparent text-[11px] text-text-primary focus:outline-none focus:bg-white/[0.03] [color-scheme:dark]"
                  />
                  <input
                    key={`end:${task.id}:${task.end_date}`}
                    type="date"
                    defaultValue={task.end_date}
                    onBlur={(e) => e.target.value && e.target.value !== task.end_date && updateTaskField(task.id, "end_date", e.target.value)}
                    className="w-[92px] shrink-0 px-1 py-1 bg-transparent text-[11px] text-text-primary focus:outline-none focus:bg-white/[0.03] [color-scheme:dark]"
                  />
                  <input
                    value={value}
                    placeholder="e.g. 2FS+3d"
                    onChange={(e) => setPredText((p) => ({ ...p, [task.id]: e.target.value }))}
                    onBlur={() => commitPredecessors(task)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className={`w-[110px] shrink-0 px-1 py-1 bg-transparent text-[11px] focus:outline-none focus:bg-white/[0.03] ${error ? "text-red-400" : "text-text-primary"}`}
                    title={error || undefined}
                  />
                </div>
              </div>
            );
          })}

          {/* Excel-style empty row for adding a task */}
          <div className="flex items-center border-b border-white/[0.04]" style={{ height: ROW_HEIGHT }}>
            <div className="w-8 shrink-0 flex items-center justify-center text-text-muted/30">
              <Plus size={11} />
            </div>
            <input
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              onBlur={addTask}
              placeholder="Type a task name…"
              className="flex-1 min-w-0 px-2 py-1 bg-transparent text-[12px] text-text-muted placeholder:text-text-muted/40 focus:outline-none focus:bg-white/[0.03]"
            />
          </div>
        </div>

        {/* Right: synced Gantt bars */}
        <div ref={ganttRef} className="flex-1 min-w-0">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <p className="text-text-muted text-[13px]">Add a task on the left to see it here.</p>
            </div>
          ) : (
            <GanttGrid
              groups={group}
              dependencies={dependencies}
              viewStart={viewStart}
              windowDays={windowDays}
              onTaskClick={(t) => setActiveTask(orderedTasks.find((pt) => pt.id === t.id) || null)}
              onTaskDatesChange={handleTaskDatesChange}
              showGroupHeaders={false}
              hideLabelColumn
            />
          )}
        </div>
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
