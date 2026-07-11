import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateWorkerReadiness } from "@/lib/worker-readiness";

function getSession(req: NextRequest): { clientId: string; name?: string } | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const onboardingId = req.nextUrl.searchParams.get("onboardingId");
  if (!onboardingId) return NextResponse.json({ error: "onboardingId required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("worker_requirements")
    .select("*, requirement_templates(*), documents(name, file_url, received, validation_status, validation_notes, expiry_date)")
    .eq("client_id", session.clientId)
    .eq("onboarding_id", onboardingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requirements: data || [] });
}

/**
 * Handles every worker-requirement state transition described in the brief:
 * internal approve/reject, external submit/approve/reject, and waive.
 * External approval is always a human action recorded here — never inferred by AI.
 */
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { action, id } = body;
  if (!action || !id) return NextResponse.json({ error: "action and id required" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: wr } = await supabase
    .from("worker_requirements")
    .select("*, requirement_templates(name), onboarding(id, employee_name)")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .single();
  if (!wr) return NextResponse.json({ error: "Requirement not found" }, { status: 404 });

  const onboardingId = (wr.onboarding as unknown as { id?: string } | null)?.id || wr.onboarding_id;

  const requirementName = (wr.requirement_templates as unknown as { name?: string } | null)?.name || "Requirement";
  const workerName = (wr.onboarding as unknown as { employee_name?: string } | null)?.employee_name || "Worker";
  const actor = session.name || "Admin";

  let updates: Record<string, unknown> = {};
  let logAction = "";
  let logStatus: "success" | "warning" | "error" = "success";

  switch (action) {
    case "internal_approve":
      updates = { internal_approval_status: "approved", internal_approved_by: actor, internal_approved_at: new Date().toISOString(), internal_rejection_reason: null };
      logAction = `Internally approved: ${requirementName} — ${workerName}`;
      break;

    case "internal_reject":
      if (!body.reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });
      updates = { internal_approval_status: "rejected", internal_rejection_reason: body.reason };
      logAction = `Internally rejected: ${requirementName} — ${workerName}`;
      logStatus = "warning";
      break;

    case "submit_external":
      updates = { external_approval_status: "submitted", external_submitted_at: new Date().toISOString(), external_submitted_by: actor, external_reference: body.reference || null };
      logAction = `Submitted to client for approval: ${requirementName} — ${workerName}`;
      break;

    case "external_approve":
      updates = { external_approval_status: "approved", external_approved_at: new Date().toISOString(), external_approved_by: body.approvedBy || actor, external_rejection_reason: null };
      logAction = `Client/site approved: ${requirementName} — ${workerName}`;
      break;

    case "external_reject":
      if (!body.reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });
      updates = { external_approval_status: "rejected", external_rejection_reason: body.reason };
      logAction = `Client/site rejected: ${requirementName} — ${workerName}`;
      logStatus = "warning";
      break;

    case "waive":
      if (!body.reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });
      updates = { waived: true, waived_reason: body.reason, waived_by: actor, waived_at: new Date().toISOString() };
      logAction = `Requirement waived: ${requirementName} — ${workerName}`;
      logStatus = "warning";
      break;

    case "unwaive":
      updates = { waived: false, waived_reason: null, waived_by: null, waived_at: null };
      logAction = `Waiver removed: ${requirementName} — ${workerName}`;
      break;

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error } = await supabase
    .from("worker_requirements")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    client_id: session.clientId,
    digital_employee: "AI Onboarding Assistant",
    action: logAction,
    details: body.reason || body.reference || "",
    status: logStatus,
  });

  const message = await buildResultMessage(session.clientId, onboardingId, workerName, requirementName, action);

  return NextResponse.json({ success: true, message });
}

/** Contextual confirmation text, e.g. "Working at Heights approved. Sam Lee has 2 remaining requirements." */
async function buildResultMessage(
  clientId: string, onboardingId: string, workerName: string, requirementName: string, action: string
): Promise<string> {
  const readiness = await calculateWorkerReadiness(clientId, onboardingId);
  const remaining = readiness.requirementCount - readiness.completedCount;

  const verb: Record<string, string> = {
    internal_approve: "approved",
    internal_reject: "rejected — replacement evidence requested",
    submit_external: "submitted to the client for approval",
    external_approve: "approved by the client",
    external_reject: "rejected by the client",
    waive: "waived",
    unwaive: "waiver removed",
  };

  if (readiness.isReady && remaining === 0) {
    return `${requirementName} ${verb[action] || "updated"}. ${workerName} is now ready to mobilise.`;
  }
  if (readiness.status === "action_required" && readiness.blockers.some((b) => b.status === "action_required")) {
    return `${requirementName} ${verb[action] || "updated"}. ${workerName} is now internally complete and ready to submit to the client.`;
  }
  return `${requirementName} ${verb[action] || "updated"}. ${workerName} has ${remaining} remaining requirement${remaining === 1 ? "" : "s"}.`;
}
