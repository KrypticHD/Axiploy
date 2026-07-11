import { supabaseAdmin } from "@/lib/supabase";

/**
 * Canonical worker-readiness engine.
 *
 * This is the ONE place that answers "is this worker ready for this
 * client/site/role on this date?" — every screen (Staff Directory, Site
 * Readiness, Approvals, Dashboard, Scheduler) should call
 * `calculateWorkerReadiness` rather than re-deriving status from raw tables.
 *
 * It supersedes the narrower `src/lib/staff-readiness.ts` (which only looked
 * at the flat `documents` table) by reasoning over the requirement-template
 * system: applicable requirements are resolved per worker via
 * `resolveWorkerRequirements`, and each requirement's state considers
 * evidence, internal approval, external approval, expiry (on the *target*
 * date, not just today), and waivers.
 */

export type ReadinessStatus =
  | "not_started"
  | "awaiting_worker"
  | "under_review"
  | "action_required"
  | "awaiting_internal_approval"
  | "awaiting_external_approval"
  | "ready"
  | "expiring_soon"
  | "expired"
  | "blocked";

// Worst-to-best precedence used to derive the single aggregate status
// from the set of per-requirement states.
const STATUS_SEVERITY: ReadinessStatus[] = [
  "blocked",
  "expired",
  "action_required",
  "awaiting_internal_approval",
  "awaiting_external_approval",
  "under_review",
  "awaiting_worker",
  "expiring_soon",
  "not_started",
  "ready",
];

export interface RequirementIssue {
  requirementId: string;
  requirementName: string;
  category: string;
  reason: string;
  status: ReadinessStatus;
}

export interface WorkerReadinessResult {
  status: ReadinessStatus;
  isReady: boolean;
  blockers: RequirementIssue[];
  warnings: RequirementIssue[];
  expiringSoon: RequirementIssue[];
  requirementCount: number;
  completedCount: number;
}

interface RequirementTemplateRow {
  id: string;
  name: string;
  category: string;
  mandatory: boolean;
  expiry_required: boolean;
  internal_approval_required: boolean;
  external_approval_required: boolean;
  reminder_lead_days: number;
}

interface WorkerRequirementRow {
  id: string;
  requirement_template_id: string;
  document_id: string | null;
  internal_approval_status: "not_required" | "pending" | "approved" | "rejected";
  external_approval_status: "not_required" | "not_submitted" | "submitted" | "awaiting_approval" | "approved" | "rejected";
  waived: boolean;
  waived_reason: string | null;
  requirement_templates: RequirementTemplateRow | RequirementTemplateRow[];
}

interface DocumentRow {
  id: string;
  received: boolean;
  validation_status: string | null;
  expiry_date: string | null;
}

function worseOf(a: ReadinessStatus, b: ReadinessStatus): ReadinessStatus {
  return STATUS_SEVERITY.indexOf(a) <= STATUS_SEVERITY.indexOf(b) ? a : b;
}

function templateOf(row: WorkerRequirementRow): RequirementTemplateRow | null {
  return Array.isArray(row.requirement_templates) ? row.requirement_templates[0] ?? null : row.requirement_templates;
}

/**
 * Determines a single requirement's state as of `targetDate` (defaults to
 * today). This is where "will this still be valid on the scheduled work
 * date" is enforced, not just "is it valid right now."
 */
function evaluateRequirement(
  wr: WorkerRequirementRow,
  doc: DocumentRow | undefined,
  targetDate: Date
): { status: ReadinessStatus; reason: string } {
  const template = templateOf(wr);
  if (!template) return { status: "ready", reason: "" };

  if (wr.waived) {
    return { status: "ready", reason: `Waived${wr.waived_reason ? `: ${wr.waived_reason}` : ""}` };
  }

  if (!template.mandatory && !doc) {
    return { status: "ready", reason: "Optional — not supplied" };
  }

  if (!doc || !doc.received) {
    return { status: "awaiting_worker", reason: "Evidence not yet supplied" };
  }

  if (doc.validation_status === "needs_review") {
    return { status: "under_review", reason: "AI flagged this document for manual review" };
  }

  if (wr.internal_approval_status === "rejected") {
    return { status: "blocked", reason: "Internally rejected — needs new evidence" };
  }

  if (template.internal_approval_required && wr.internal_approval_status === "pending") {
    return { status: "awaiting_internal_approval", reason: "Awaiting internal review" };
  }

  if (template.expiry_required && doc.expiry_date) {
    const expiry = new Date(doc.expiry_date);
    if (expiry < targetDate) {
      return { status: "expired", reason: `Expired ${doc.expiry_date}` };
    }
    const daysUntil = Math.floor((expiry.getTime() - targetDate.getTime()) / 86400000);
    if (daysUntil <= (template.reminder_lead_days ?? 14)) {
      return { status: "expiring_soon", reason: `Expires ${doc.expiry_date} (${daysUntil}d)` };
    }
  }

  if (wr.external_approval_status === "rejected") {
    return { status: "blocked", reason: "External/client approval rejected" };
  }

  if (template.external_approval_required && wr.external_approval_status !== "approved") {
    if (wr.external_approval_status === "not_submitted") {
      return { status: "action_required", reason: "Ready to submit for client approval" };
    }
    return { status: "awaiting_external_approval", reason: "Awaiting client/site approval" };
  }

  return { status: "ready", reason: "" };
}

export async function calculateWorkerReadiness(
  clientId: string,
  onboardingId: string,
  opts?: { scheduledDate?: string }
): Promise<WorkerReadinessResult> {
  const supabase = supabaseAdmin();
  const targetDate = opts?.scheduledDate ? new Date(opts.scheduledDate) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const { data: workerReqs } = await supabase
    .from("worker_requirements")
    .select("*, requirement_templates(*)")
    .eq("client_id", clientId)
    .eq("onboarding_id", onboardingId);

  const rows = (workerReqs || []) as unknown as WorkerRequirementRow[];

  if (rows.length === 0) {
    return { status: "not_started", isReady: false, blockers: [], warnings: [], expiringSoon: [], requirementCount: 0, completedCount: 0 };
  }

  const docIds = rows.map((r) => r.document_id).filter((id): id is string => !!id);
  const { data: docs } = docIds.length
    ? await supabase.from("documents").select("id, received, validation_status, expiry_date").in("id", docIds)
    : { data: [] };
  const docById = new Map((docs || []).map((d) => [d.id, d as DocumentRow]));

  let aggregate: ReadinessStatus = "ready";
  const blockers: RequirementIssue[] = [];
  const warnings: RequirementIssue[] = [];
  const expiringSoon: RequirementIssue[] = [];
  let completedCount = 0;

  for (const wr of rows) {
    const template = templateOf(wr);
    if (!template) continue;
    const doc = wr.document_id ? docById.get(wr.document_id) : undefined;
    const { status, reason } = evaluateRequirement(wr, doc, targetDate);

    if (status === "ready") completedCount++;
    if (!template.mandatory && status !== "ready" && status !== "expiring_soon") {
      // Optional requirement issues are informational only — don't drag down the aggregate.
      continue;
    }

    aggregate = worseOf(aggregate, status);

    const issue: RequirementIssue = {
      requirementId: wr.requirement_template_id,
      requirementName: template.name,
      category: template.category,
      reason,
      status,
    };

    if (status === "expiring_soon") expiringSoon.push(issue);
    else if (status === "ready") continue;
    else if (["blocked", "expired", "action_required"].includes(status)) blockers.push(issue);
    else warnings.push(issue);
  }

  return {
    status: aggregate,
    isReady: aggregate === "ready" || aggregate === "expiring_soon",
    blockers,
    warnings,
    expiringSoon,
    requirementCount: rows.length,
    completedCount,
  };
}

/**
 * Resolves which requirement templates apply to a worker (by client + site +
 * role) and creates any missing `worker_requirements` rows. Idempotent —
 * safe to call whenever a worker's client/site/role changes, or on a schedule.
 */
export async function resolveWorkerRequirements(clientId: string, onboardingId: string): Promise<number> {
  const supabase = supabaseAdmin();

  const { data: worker } = await supabase
    .from("onboarding")
    .select("id, role, site_id")
    .eq("id", onboardingId)
    .eq("client_id", clientId)
    .single();
  if (!worker) return 0;

  const { data: templates } = await supabase
    .from("requirement_templates")
    .select("id, site_id, role, name, mandatory, internal_approval_required, external_approval_required")
    .eq("client_id", clientId)
    .eq("active", true);

  const applicable = (templates || []).filter((t) => {
    const siteMatches = !t.site_id || t.site_id === worker.site_id;
    const roleMatches = !t.role || (worker.role || "").trim().toLowerCase() === (t.role || "").trim().toLowerCase();
    return siteMatches && roleMatches;
  });

  if (applicable.length === 0) return 0;

  const { data: existing } = await supabase
    .from("worker_requirements")
    .select("requirement_template_id")
    .eq("onboarding_id", onboardingId);
  const existingIds = new Set((existing || []).map((e) => e.requirement_template_id));

  const toCreate = applicable.filter((t) => !existingIds.has(t.id));
  if (toCreate.length === 0) return 0;

  // Create a matching `documents` row per requirement so the existing
  // upload page + Claude vision validation pipeline works unchanged —
  // no separate upload UI needed for requirement evidence.
  const docInserts = toCreate.map((t) => ({
    client_id: clientId,
    onboarding_id: onboardingId,
    name: t.name,
    required: t.mandatory,
    received: false,
  }));
  const { data: newDocs } = await supabase.from("documents").insert(docInserts).select("id, name");

  await supabase.from("worker_requirements").insert(
    toCreate.map((t) => ({
      client_id: clientId,
      onboarding_id: onboardingId,
      requirement_template_id: t.id,
      document_id: (newDocs || []).find((d) => d.name === t.name)?.id || null,
      internal_approval_status: t.internal_approval_required ? "pending" : "not_required",
      external_approval_status: t.external_approval_required ? "not_submitted" : "not_required",
    }))
  );

  // Keep onboarding.documents_required/missing_documents in sync with the
  // existing onboarding progress fields other screens already read.
  const { count: totalRequired } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("onboarding_id", onboardingId)
    .eq("required", true);
  await supabase.from("onboarding").update({ documents_required: totalRequired || 0 }).eq("id", onboardingId);

  await supabase.from("activity_log").insert({
    client_id: clientId,
    digital_employee: "AI Onboarding Assistant",
    action: `Requirements resolved for worker`,
    details: `${toCreate.length} requirement(s) applied`,
    status: "success",
  });

  return toCreate.length;
}
