import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveWorkerRequirements } from "@/lib/worker-readiness";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const updates = await req.json();
  const { data, error } = await supabaseAdmin()
    .from("onboarding")
    .update(updates)
    .eq("id", id)
    .eq("client_id", session.clientId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let requirementsResolved = 0;
  if (updates.site_id !== undefined || updates.role !== undefined) {
    requirementsResolved = await resolveWorkerRequirements(session.clientId, id);
    await supabaseAdmin().from("activity_log").insert({
      client_id: session.clientId,
      digital_employee: "AI Onboarding Assistant",
      action: `Worker assigned to site/role: ${data.employee_name}`,
      details: requirementsResolved > 0 ? `${requirementsResolved} new requirement(s) applied` : "No change in applicable requirements",
      status: "success",
    });
  }

  return NextResponse.json({ onboarding: data, requirementsResolved });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  // Delete documents first (FK constraint)
  await supabaseAdmin().from("documents").delete().eq("onboarding_id", id);

  // Delete the onboarding record (scoped to client for safety)
  const { error } = await supabaseAdmin()
    .from("onboarding")
    .delete()
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
