"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface GanttTask {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  assignments?: { id: string }[];
}

export interface GanttDependency {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  link_type: "FS" | "SS" | "FF" | "SF";
}

export interface GanttGroup {
  id: string;
  label: string;
  href?: string;
  tasks: GanttTask[];
}

export const STATUS_COLOR: Record<string, string> = {
  not_started: "bg-white/15",
  in_progress: "bg-accent-blue",
  complete: "bg-emerald-500",
  blocked: "bg-red-500",
};

export const DAY_MS = 86400000;
export const DAY_WIDTH = 34;
const ROW_HEIGHT = 34;
const LABEL_WIDTH = 200;
const HEADER_HEIGHT = 44;
const GROUP_ROW_HEIGHT = 30;

export function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

interface DragState {
  taskId: string;
  mode: "move" | "resize-left" | "resize-right";
  pointerId: number;
  startX: number;
  originalStart: string;
  originalEnd: string;
}

export default function GanttGrid({
  groups, dependencies, viewStart, windowDays, onTaskClick, onTaskDatesChange, showGroupHeaders = true,
}: {
  groups: GanttGroup[];
  dependencies: GanttDependency[];
  viewStart: Date;
  windowDays: number;
  onTaskClick: (task: GanttTask) => void;
  onTaskDatesChange: (taskId: string, newStart: string, newEnd: string) => void;
  showGroupHeaders?: boolean;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ taskId: string; start_date: string; end_date: string } | null>(null);

  const days = useMemo(
    () => Array.from({ length: windowDays }, (_, i) => new Date(viewStart.getTime() + i * DAY_MS)),
    [viewStart, windowDays]
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Flatten into layout rows so we can compute pixel Y for every task (for dependency arrows)
  type LayoutRow = { type: "group"; group: GanttGroup } | { type: "task"; task: GanttTask };
  const layoutRows: LayoutRow[] = [];
  for (const g of groups) {
    if (showGroupHeaders) layoutRows.push({ type: "group", group: g });
    for (const t of g.tasks) layoutRows.push({ type: "task", task: t });
  }

  function taskDates(task: GanttTask): { start: string; end: string } {
    if (dragPreview && dragPreview.taskId === task.id) return { start: dragPreview.start_date, end: dragPreview.end_date };
    return { start: task.start_date, end: task.end_date };
  }

  function pixelsFor(start: string, end: string): { left: number; width: number; visible: boolean } {
    const startOffset = daysBetween(viewStart, new Date(start));
    const endOffset = daysBetween(viewStart, new Date(end)) + 1;
    const clampedStart = Math.max(0, startOffset);
    const clampedEnd = Math.min(windowDays, endOffset);
    const span = Math.max(1, clampedEnd - clampedStart);
    return { left: clampedStart * DAY_WIDTH, width: span * DAY_WIDTH - 4, visible: endOffset > 0 && startOffset < windowDays };
  }

  // Precompute y-centre per task (in pixels, relative to the grid content area below the day header)
  const taskY = new Map<string, number>();
  let cursorY = 0;
  for (const row of layoutRows) {
    const h = row.type === "group" ? GROUP_ROW_HEIGHT : ROW_HEIGHT;
    if (row.type === "task") taskY.set(row.task.id, cursorY + h / 2);
    cursorY += h;
  }
  const totalHeight = cursorY;

  const taskById = new Map<string, GanttTask>();
  for (const g of groups) for (const t of g.tasks) taskById.set(t.id, t);

  function handlePointerDown(e: React.PointerEvent, task: GanttTask, mode: DragState["mode"]) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ taskId: task.id, mode, pointerId: e.pointerId, startX: e.clientX, originalStart: task.start_date, originalEnd: task.end_date });
    setDragPreview({ taskId: task.id, start_date: task.start_date, end_date: task.end_date });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dayDelta = Math.round((e.clientX - drag.startX) / DAY_WIDTH);
    if (dayDelta === 0) {
      setDragPreview({ taskId: drag.taskId, start_date: drag.originalStart, end_date: drag.originalEnd });
      return;
    }
    let newStart = drag.originalStart;
    let newEnd = drag.originalEnd;
    if (drag.mode === "move") {
      newStart = addDays(drag.originalStart, dayDelta);
      newEnd = addDays(drag.originalEnd, dayDelta);
    } else if (drag.mode === "resize-right") {
      newEnd = addDays(drag.originalEnd, dayDelta);
      if (new Date(newEnd) < new Date(newStart)) newEnd = newStart;
    } else if (drag.mode === "resize-left") {
      newStart = addDays(drag.originalStart, dayDelta);
      if (new Date(newStart) > new Date(newEnd)) newStart = newEnd;
    }
    setDragPreview({ taskId: drag.taskId, start_date: newStart, end_date: newEnd });
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const preview = dragPreview;
    setDrag(null);
    if (preview && (preview.start_date !== drag.originalStart || preview.end_date !== drag.originalEnd)) {
      onTaskDatesChange(preview.taskId, preview.start_date, preview.end_date);
    }
    setDragPreview(null);
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: LABEL_WIDTH + windowDays * DAY_WIDTH }}>
        {/* Day header */}
        <div className="flex border-b border-white/[0.06] sticky top-0 bg-surface z-10" style={{ height: HEADER_HEIGHT }}>
          <div className="shrink-0 px-3 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wide" style={{ width: LABEL_WIDTH }}>Project / Task</div>
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

        {/* Rows + dependency overlay */}
        <div className="relative">
          <svg
            className="absolute top-0 pointer-events-none z-10"
            style={{ left: LABEL_WIDTH, width: windowDays * DAY_WIDTH, height: totalHeight }}
          >
            {dependencies.map((dep) => {
              const pred = taskById.get(dep.predecessor_task_id);
              const succ = taskById.get(dep.successor_task_id);
              if (!pred || !succ) return null;
              const predY = taskY.get(dep.predecessor_task_id);
              const succY = taskY.get(dep.successor_task_id);
              if (predY === undefined || succY === undefined) return null;

              const predDates = taskDates(pred);
              const succDates = taskDates(succ);
              const predPx = pixelsFor(predDates.start, predDates.end);
              const succPx = pixelsFor(succDates.start, succDates.end);

              const fromLeftEdge = dep.link_type === "SS" || dep.link_type === "SF";
              const toLeftEdge = dep.link_type === "FS" || dep.link_type === "SS";
              const x1 = fromLeftEdge ? predPx.left : predPx.left + predPx.width;
              const x2 = toLeftEdge ? succPx.left : succPx.left + succPx.width;
              const midX = (x1 + x2) / 2;

              return (
                <path
                  key={dep.id}
                  d={`M ${x1} ${predY} C ${midX} ${predY}, ${midX} ${succY}, ${x2} ${succY}`}
                  stroke="rgba(148,163,184,0.5)"
                  strokeWidth={1.3}
                  fill="none"
                  markerEnd="url(#gantt-arrow)"
                />
              );
            })}
            <defs>
              <marker id="gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="rgba(148,163,184,0.7)" />
              </marker>
            </defs>
          </svg>

          {layoutRows.map((row, i) => {
            if (row.type === "group") {
              return (
                <div key={`g:${row.group.id}`} className="flex border-b border-white/[0.04] bg-white/[0.015]" style={{ height: GROUP_ROW_HEIGHT }}>
                  <div className="shrink-0 px-3 flex items-center text-[12px] font-semibold text-text-primary truncate" style={{ width: LABEL_WIDTH }}>
                    {row.group.href ? (
                      <Link href={row.group.href} className="hover:text-accent-cyan transition-colors">{row.group.label}</Link>
                    ) : row.group.label}
                  </div>
                  <div style={{ width: windowDays * DAY_WIDTH }} className="shrink-0" />
                </div>
              );
            }

            const task = row.task;
            const dates = taskDates(task);
            const { left, width, visible } = pixelsFor(dates.start, dates.end);
            const isDragging = drag?.taskId === task.id;

            return (
              <div key={task.id} className="flex border-b border-white/[0.04] relative" style={{ height: ROW_HEIGHT }}>
                <div className="shrink-0 px-3 py-2 text-[11px] text-text-muted truncate flex items-center gap-1.5" style={{ width: LABEL_WIDTH }}>
                  {(task.assignments?.length || 0) > 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />}
                  {task.name}
                </div>
                <div className="relative shrink-0" style={{ width: windowDays * DAY_WIDTH }}>
                  {visible && (
                    <div
                      style={{ left, width }}
                      className={`absolute top-1 h-6 rounded-md ${STATUS_COLOR[task.status] || "bg-white/15"} ${isDragging ? "opacity-70 ring-1 ring-white/40" : "hover:opacity-80"} transition-opacity group`}
                    >
                      <div
                        onPointerDown={(e) => handlePointerDown(e, task, "move")}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onClick={() => !drag && onTaskClick(task)}
                        className="absolute inset-0 flex items-center px-2 cursor-grab active:cursor-grabbing overflow-hidden"
                      >
                        <span className="text-[10px] text-white font-medium truncate pointer-events-none">{task.name}</span>
                      </div>
                      <div
                        onPointerDown={(e) => handlePointerDown(e, task, "resize-left")}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, task, "resize-right")}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
