import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId || null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from("requirement_templates")
    .select("*, sites(name)")
    .eq("client_id", clientId)
    .order("display_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const templates = (data || []).map((t) => ({
    ...t,
    siteName: (t.sites as unknown as { name?: string } | null)?.name || null,
  }));

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const {
    site_id, role, name, category, document_type, mandatory, expiry_required,
    default_validity_days, internal_approval_required, external_approval_required,
    reminder_lead_days, notes, display_order,
  } = body;

  if (!name) return NextResponse.json({ error: "Requirement name is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("requirement_templates")
    .insert({
      client_id: clientId,
      site_id: site_id || null,
      role: role || null,
      name,
      category: category || "Other",
      document_type: document_type || null,
      mandatory: mandatory ?? true,
      expiry_required: expiry_required ?? false,
      default_validity_days: default_validity_days || null,
      internal_approval_required: internal_approval_required ?? true,
      external_approval_required: external_approval_required ?? false,
      reminder_lead_days: reminder_lead_days ?? 14,
      notes: notes || null,
      active: true,
      display_order: display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "AI Onboarding Assistant",
    action: `Requirement template created: ${name}`,
    details: `${role ? `Role: ${role}` : "All roles"}`,
    status: "success",
  });

  return NextResponse.json({ template: data });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("requirement_templates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}

export async function DELETE(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin().from("requirement_templates").delete().eq("id", id).eq("client_id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
