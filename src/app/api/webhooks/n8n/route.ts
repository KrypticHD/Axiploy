import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const SECRET = process.env.N8N_WEBHOOK_SECRET;

function unauthorised() {
  return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  // Verify secret
  const authHeader = req.headers.get("x-webhook-secret");
  if (!SECRET || authHeader !== SECRET) return unauthorised();

  const body = await req.json();
  const { type, clientId } = body;

  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const supabase = supabaseAdmin();

  // --- Log activity ---
  if (type === "activity") {
    const { digitalEmployee, action, details, status } = body;
    const { error } = await supabase.from("activity_log").insert({
      client_id: clientId,
      digital_employee: digitalEmployee || "AI Assistant",
      action,
      details: details || "",
      status: status || "success",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // --- Create approval request ---
  if (type === "approval") {
    const { approvalType, employeeName, requestedBy, description } = body;
    const { data, error } = await supabase.from("approvals").insert({
      client_id: clientId,
      type: approvalType,
      employee_name: employeeName || "",
      requested_by: requestedBy || "AI Assistant",
      description: description || "",
      status: "pending",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, approvalId: data.id });
  }

  // --- Update onboarding status ---
  if (type === "onboarding_update") {
    const { onboardingId, status, progress, missingDocuments } = body;
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (progress !== undefined) updates.progress = progress;
    if (missingDocuments !== undefined) updates.missing_documents = missingDocuments;

    const { error } = await supabase
      .from("onboarding")
      .update(updates)
      .eq("id", onboardingId)
      .eq("client_id", clientId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
}
