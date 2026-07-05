import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, emailWrapper } from "@/lib/email";

export const runtime = "nodejs";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).clientId || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { incidentId, description, assignedTo, assignedEmail, dueDate } = await req.json();
  if (!incidentId || !description) {
    return NextResponse.json({ error: "incidentId and description required" }, { status: 400 });
  }

  const { data: incident } = await supabaseAdmin()
    .from("safety_incidents")
    .select("incident_type, description")
    .eq("id", incidentId)
    .eq("client_id", clientId)
    .single();

  if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  const { data: action, error } = await supabaseAdmin()
    .from("corrective_actions")
    .insert({
      incident_id: incidentId,
      client_id: clientId,
      description,
      assigned_to: assignedTo || null,
      assigned_email: assignedEmail || null,
      due_date: dueDate || null,
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "AI Safety Assistant",
    action: `Corrective action assigned: ${description}`,
    details: assignedTo ? `Assigned to ${assignedTo}${dueDate ? ` · due ${dueDate}` : ""}` : "Unassigned",
    status: "success",
  });

  if (assignedEmail) {
    sendEmail({
      to: assignedEmail,
      subject: `Corrective action assigned: ${incident.incident_type.replace("_", " ")}`,
      html: emailWrapper(`
        <div class="card">
          <div class="heading">📋 Corrective action assigned to you</div>
          <div class="sub">${description}</div>
          ${dueDate ? `<div class="item"><div class="dot dot-amber"></div><div>Due: <strong style="color:#fff">${new Date(dueDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</strong></div></div>` : ""}
          <div class="item"><div class="dot dot-grey"></div><div>Related incident: ${incident.description}</div></div>
          <p style="margin-top:16px">Please action this and mark it complete once done.</p>
        </div>
      `),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, action });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const updates: Record<string, string> = { status };
  if (status === "complete") updates.completed_at = new Date().toISOString();

  const { error } = await supabaseAdmin()
    .from("corrective_actions")
    .update(updates)
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
