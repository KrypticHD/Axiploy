import { supabaseAdmin } from "@/lib/supabase";

export type LinkType = "FS" | "SS" | "FF" | "SF";

export interface TaskDates {
  start_date: string;
  end_date: string;
}

const DAY_MS = 86400000;

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS);
}

/**
 * Given a predecessor's dates and a link type/lag, returns the earliest
 * start/end the successor is allowed to have. Only the constrained side
 * (start for FS/SS, end for FF/SF) is meaningful — the other is null.
 */
export function computeRequiredWindow(
  linkType: LinkType,
  lagDays: number,
  predStart: string,
  predEnd: string
): { minStart: string | null; minEnd: string | null } {
  switch (linkType) {
    case "FS":
      return { minStart: addDays(predEnd, 1 + lagDays), minEnd: null };
    case "SS":
      return { minStart: addDays(predStart, lagDays), minEnd: null };
    case "FF":
      return { minStart: null, minEnd: addDays(predEnd, lagDays) };
    case "SF":
      return { minStart: null, minEnd: addDays(predStart, lagDays) };
  }
}

interface DependencyRow {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  link_type: LinkType;
  lag_days: number;
}

/** BFS from the proposed successor — if the proposed predecessor is reachable, linking would close a loop. */
export async function wouldCreateCycle(clientId: string, predecessorId: string, successorId: string): Promise<boolean> {
  if (predecessorId === successorId) return true;

  const { data: allDeps } = await supabaseAdmin()
    .from("task_dependencies")
    .select("predecessor_task_id, successor_task_id")
    .eq("client_id", clientId);

  const deps = (allDeps || []) as { predecessor_task_id: string; successor_task_id: string }[];
  const visited = new Set<string>([successorId]);
  const queue = [successorId];

  while (queue.length) {
    const current = queue.shift()!;
    if (current === predecessorId) return true;
    for (const dep of deps) {
      if (dep.predecessor_task_id === current && !visited.has(dep.successor_task_id)) {
        visited.add(dep.successor_task_id);
        queue.push(dep.successor_task_id);
      }
    }
  }
  return false;
}

/**
 * Cascades date shifts outward from a task that just changed. Shifts each
 * direct successor just enough to satisfy its link constraint (preserving
 * the successor's own duration), then recurses into that successor's
 * dependents. A visited-set prevents infinite loops if a cycle somehow exists.
 * Returns every task that was actually moved.
 */
export async function cascadeFromTask(clientId: string, taskId: string): Promise<(TaskDates & { id: string; name: string })[]> {
  const supabase = supabaseAdmin();
  const shifted: (TaskDates & { id: string; name: string })[] = [];
  const visited = new Set<string>([taskId]);
  const queue = [taskId];

  while (queue.length) {
    const current = queue.shift()!;

    const { data: task } = await supabase
      .from("project_tasks")
      .select("id, start_date, end_date")
      .eq("id", current)
      .eq("client_id", clientId)
      .single();
    if (!task) continue;

    const { data: outgoing } = await supabase
      .from("task_dependencies")
      .select("*")
      .eq("client_id", clientId)
      .eq("predecessor_task_id", current);

    for (const dep of (outgoing || []) as DependencyRow[]) {
      if (visited.has(dep.successor_task_id)) continue;

      const { data: successor } = await supabase
        .from("project_tasks")
        .select("id, name, start_date, end_date")
        .eq("id", dep.successor_task_id)
        .eq("client_id", clientId)
        .single();
      if (!successor) continue;

      const { minStart, minEnd } = computeRequiredWindow(dep.link_type, dep.lag_days, task.start_date, task.end_date);
      const durationDays = daysBetween(successor.start_date, successor.end_date);

      let newStart = successor.start_date;
      let newEnd = successor.end_date;
      let needsShift = false;

      if (minStart && new Date(successor.start_date) < new Date(minStart)) {
        newStart = minStart;
        newEnd = addDays(minStart, durationDays);
        needsShift = true;
      } else if (minEnd && new Date(successor.end_date) < new Date(minEnd)) {
        newEnd = minEnd;
        newStart = addDays(minEnd, -durationDays);
        needsShift = true;
      }

      if (needsShift) {
        await supabase.from("project_tasks").update({ start_date: newStart, end_date: newEnd }).eq("id", successor.id);
        shifted.push({ id: successor.id, name: successor.name, start_date: newStart, end_date: newEnd });
      }

      visited.add(dep.successor_task_id);
      queue.push(dep.successor_task_id);
    }
  }

  return shifted;
}
