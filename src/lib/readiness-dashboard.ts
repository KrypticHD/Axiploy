import { supabaseAdmin } from "@/lib/supabase";
import { calculateWorkerReadiness, type ReadinessStatus, type WorkerReadinessResult } from "@/lib/worker-readiness";

/**
 * Aggregates the canonical readiness engine across every worker for a
 * tenant, so the dashboard shows real operational counts rather than a
 * second, ad-hoc readiness interpretation. Capped at 300 workers per
 * tenant per load — fine for a pilot; would need pagination for scale.
 */

export interface ReadinessCounts {
  total: number;
  ready: number;
  awaitingDocuments: number;
  underReview: number;
  awaitingClientApproval: number;
  expiringSoon: number;
  expired: number;
  scheduledButBlocked: number;
}

export interface ActionItem {
  onboardingId: string;
  employeeName: string;
  requirementName: string;
  reason: string;
  status: ReadinessStatus;
}

export interface MobilisationRow {
  onboardingId: string;
  employeeName: string;
  siteName: string | null;
  role: string;
  startDate: string;
  status: ReadinessStatus;
  mainBlocker: string | null;
}

export interface ExpiryRow {
  onboardingId: string;
  employeeName: string;
  requirementName: string;
  reason: string;
  daysRemaining: number | null;
}

export interface DashboardReadiness {
  counts: ReadinessCounts;
  actionRequired: ActionItem[];
  upcomingMobilisation: MobilisationRow[];
  upcomingExpiries: ExpiryRow[];
}

const WORKER_CAP = 300;

export async function getDashboardReadiness(clientId: string): Promise<DashboardReadiness> {
  const supabase = supabaseAdmin();

  const [workersRes, sitesRes] = await Promise.all([
    supabase.from("onboarding").select("id, employee_name, role, site_id, status").eq("client_id", clientId).limit(WORKER_CAP),
    supabase.from("sites").select("id, name").eq("client_id", clientId),
  ]);

  const workers = workersRes.data || [];
  const siteNameById = new Map((sitesRes.data || []).map((s) => [s.id, s.name]));

  const results = await Promise.all(
    workers.map(async (w) => ({ worker: w, readiness: await calculateWorkerReadiness(clientId, w.id) }))
  );

  const counts: ReadinessCounts = {
    total: workers.length, ready: 0, awaitingDocuments: 0, underReview: 0,
    awaitingClientApproval: 0, expiringSoon: 0, expired: 0, scheduledButBlocked: 0,
  };
  const actionRequired: ActionItem[] = [];
  const expiries: ExpiryRow[] = [];

  const readinessById = new Map<string, WorkerReadinessResult>();

  for (const { worker, readiness } of results) {
    readinessById.set(worker.id, readiness);

    if (readiness.status === "ready") counts.ready++;
    else if (readiness.status === "awaiting_worker") counts.awaitingDocuments++;
    else if (readiness.status === "under_review" || readiness.status === "awaiting_internal_approval") counts.underReview++;
    else if (readiness.status === "awaiting_external_approval") counts.awaitingClientApproval++;
    else if (readiness.status === "expired") counts.expired++;
    if (readiness.status === "expiring_soon" || readiness.expiringSoon.length > 0) counts.expiringSoon++;

    for (const b of readiness.blockers) {
      actionRequired.push({ onboardingId: worker.id, employeeName: worker.employee_name, requirementName: b.requirementName, reason: b.reason, status: b.status });
    }
    for (const e of readiness.expiringSoon) {
      const match = /\((\d+)d\)/.exec(e.reason);
      expiries.push({ onboardingId: worker.id, employeeName: worker.employee_name, requirementName: e.requirementName, reason: e.reason, daysRemaining: match ? parseInt(match[1], 10) : null });
    }
  }

  // Upcoming mobilisation — assignments scheduled soon, joined against readiness
  const workerIds = workers.map((w) => w.id);
  const { data: assignments } = workerIds.length
    ? await supabase
        .from("task_assignments")
        .select("staff_id, start_date, project_tasks(name, project_id, projects(name))")
        .eq("client_id", clientId)
        .in("staff_id", workerIds)
        .gte("start_date", new Date().toISOString().split("T")[0])
        .order("start_date", { ascending: true })
        .limit(50)
    : { data: [] };

  const upcomingMobilisation: MobilisationRow[] = (assignments || [])
    .map((a) => {
      const worker = workers.find((w) => w.id === a.staff_id);
      if (!worker) return null;
      const readiness = readinessById.get(worker.id);
      const mainBlocker = readiness?.blockers[0]?.requirementName || null;
      if (readiness && (readiness.status === "action_required" || readiness.status === "blocked")) counts.scheduledButBlocked++;
      return {
        onboardingId: worker.id,
        employeeName: worker.employee_name,
        siteName: worker.site_id ? siteNameById.get(worker.site_id) || null : null,
        role: worker.role,
        startDate: a.start_date,
        status: readiness?.status || "not_started",
        mainBlocker,
      };
    })
    .filter((r): r is MobilisationRow => !!r)
    .slice(0, 8);

  actionRequired.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  expiries.sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));

  return {
    counts,
    actionRequired: actionRequired.slice(0, 12),
    upcomingMobilisation,
    upcomingExpiries: expiries.slice(0, 12),
  };
}
