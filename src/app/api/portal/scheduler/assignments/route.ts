import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateWorkerReadiness } from "@/lib/worker-readiness";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).clientId || null;
  } catch {
    return null;
  }
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) <= new Date(bEnd) && new Date(bStart) <= new Date(aEnd);
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { task_id, resource_type, staff_id, equipment_id, resource_name, start_date, end_date, overrideReason } = body;

  if (!task_id || !resource_type || !resource_name || !start_date || !end_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: task } = await supabaseAdmin()
    .from("project_tasks")
    .select("id, project_id")
    .eq("id", task_id)
    .eq("client_id", clientId)
    .single();

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const warnings: string[] = [];
  let blockingReadiness: Awaited<ReturnType<typeof calculateWorkerReadiness>> | null = null;

  // Double-booking check — same resource, overlapping dates, different task
  if (staff_id || equipment_id) {
    const column = staff_id ? "staff_id" : "equipment_id";
    const value = staff_id || equipment_id;
    const { data: existing } = await supabaseAdmin()
      .from("task_assignments")
      .select("start_date, end_date, task_id, project_id")
      .eq("client_id", clientId)
      .eq(column, value)
      .neq("task_id", task_id);

    const clash = (existing || []).find((a) => overlaps(start_date, end_date, a.start_date, a.end_date));
    if (clash) {
      warnings.push(`${resource_name} is already assigned to another task with overlapping dates.`);
    }
  }

  // Worker readiness check — via the canonical engine, evaluated on the
  // assignment's scheduled end date (not just today), per requirement.
  if (resource_type === "staff" && staff_id) {
    const readiness = await calculateWorkerReadiness(clientId, staff_id, { scheduledDate: end_date });
    if (!readiness.isReady) {
      blockingReadiness = readiness;
      const summary = readiness.blockers.length
        ? readiness.blockers.map((b) => `${b.requirementName} (${b.reason})`).join(", ")
        : "not yet ready for this assignment date";
      warnings.push(`${resource_name} is not ready for this date — ${summary}`);
    }
  }

  // Equipment compliance check
  if (resource_type === "equipment" && equipment_id) {
    const { data: equip } = await supabaseAdmin()
      .from("equipment")
      .select("compliance_expiry")
      .eq("id", equipment_id)
      .single();
    if (equip?.compliance_expiry && new Date(equip.compliance_expiry) < new Date(end_date)) {
      const expired = new Date(equip.compliance_expiry) < new Date();
      warnings.push(
        expired
          ? `${resource_name}'s compliance/inspection has already expired.`
          : `${resource_name}'s compliance/inspection expires before this assignment ends.`
      );
    }
  }

  // Enforcement mode — only worker-readiness blockers are gated (not double-booking
  // or equipment, which remain warn-and-allow regardless of the tenant setting).
  if (blockingReadiness && blockingReadiness.blockers.length > 0) {
    const { data: client } = await supabaseAdmin()
      .from("clients")
      .select("scheduling_enforcement_mode")
      .eq("id", clientId)
      .single();
    const mode = client?.scheduling_enforcement_mode || "manager_override";

    if (mode === "hard_block") {
      return NextResponse.json({
        error: "This worker cannot be scheduled — mandatory requirements are unresolved.",
        blockers: blockingReadiness.blockers,
        mode,
      }, { status: 409 });
    }

    if (mode === "manager_override" && !overrideReason) {
      return NextResponse.json({
        requiresOverride: true,
        blockers: blockingReadiness.blockers,
        message: "This worker isn't ready for this date. Provide an override reason to proceed anyway.",
      }, { status: 409 });
    }
  }

  const { data, error } = await supabaseAdmin()
    .from("task_assignments")
    .insert({
      task_id,
      project_id: task.project_id,
      client_id: clientId,
      resource_type,
      staff_id: staff_id || null,
      equipment_id: equipment_id || null,
      resource_name,
      start_date,
      end_date,
      readiness_override_reason: overrideReason || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "Scheduler",
    action: overrideReason ? `Resource assigned with readiness override: ${resource_name}` : `Resource assigned: ${resource_name}`,
    details: overrideReason ? `Override reason: ${overrideReason} · ${warnings.join(" · ")}` : (warnings.length ? warnings.join(" · ") : "No conflicts detected"),
    status: warnings.length ? "warning" : "success",
  });

  return NextResponse.json({ assignment: data, warnings });
}

export async function DELETE(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin()
    .from("task_assignments")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
