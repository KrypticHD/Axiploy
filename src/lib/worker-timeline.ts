import { supabaseAdmin } from "@/lib/supabase";

/**
 * Normalizes a worker's history out of the existing `activity_log` table.
 *
 * `activity_log` has no FK to a worker — every insert embeds the worker's
 * name inside `action`/`details` (see worker-readiness.ts, onboarding
 * routes, cron reminders). This module is the one place that re-derives a
 * per-worker event feed from that convention, so the Staff timeline and
 * Dashboard "action required" lists share one interpretation rather than
 * each re-parsing activity_log independently.
 */

export type TimelineCategory =
  | "worker" | "requirement" | "document" | "reminder" | "approval" | "scheduling" | "other";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: TimelineCategory;
  label: string;
  detail: string;
  actor: string;
  status: "success" | "warning" | "error" | "info";
}

interface ActivityRow {
  id: string;
  digital_employee: string | null;
  action: string | null;
  details: string | null;
  status: string | null;
  created_at: string;
}

const CATEGORY_RULES: { test: RegExp; category: TimelineCategory }[] = [
  { test: /requirement.*(resolved|waived|applied)/i, category: "requirement" },
  { test: /(document|evidence|ticket).*(reject|approv|upload|expir|renew)/i, category: "document" },
  { test: /(reminder|reminder sent|reminder failed|chase)/i, category: "reminder" },
  { test: /(internal|client|external).*(approv|reject|submit)/i, category: "approval" },
  { test: /(assign|schedul|override|task)/i, category: "scheduling" },
  { test: /(worker|onboarding|assigned to site|created)/i, category: "worker" },
];

function categoryOf(action: string): TimelineCategory {
  for (const rule of CATEGORY_RULES) if (rule.test.test(action)) return rule.category;
  return "other";
}

function statusOf(raw: string | null): TimelineEvent["status"] {
  if (raw === "error") return "error";
  if (raw === "warning") return "warning";
  if (raw === "success") return "success";
  return "info";
}

/** Word-boundary-ish match so "Sam" doesn't match "Samantha". */
function mentionsWorker(text: string, name: string): boolean {
  const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return false;
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

export async function getWorkerTimeline(clientId: string, employeeName: string): Promise<TimelineEvent[]> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("activity_log")
    .select("id, digital_employee, action, details, status, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (data || []) as ActivityRow[];
  const matched = rows.filter((r) => mentionsWorker(`${r.action || ""} ${r.details || ""}`, employeeName));

  return matched.map((r) => ({
    id: r.id,
    timestamp: r.created_at,
    category: categoryOf(r.action || ""),
    label: r.action || "Activity",
    detail: r.details || "",
    actor: r.digital_employee || "System",
    status: statusOf(r.status),
  }));
}

export interface TimelineGroup {
  label: string;
  events: TimelineEvent[];
}

export function groupTimelineByRecency(events: TimelineEvent[]): TimelineGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 7 * 86400000);

  const buckets: Record<string, TimelineEvent[]> = { Today: [], Yesterday: [], "Earlier this week": [], Older: [] };
  for (const e of events) {
    const t = new Date(e.timestamp);
    if (t >= startOfToday) buckets.Today.push(e);
    else if (t >= startOfYesterday) buckets.Yesterday.push(e);
    else if (t >= startOfWeek) buckets["Earlier this week"].push(e);
    else buckets.Older.push(e);
  }

  return Object.entries(buckets)
    .filter(([, events]) => events.length > 0)
    .map(([label, events]) => ({ label, events }));
}
