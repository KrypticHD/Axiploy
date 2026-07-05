import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from("onboarding")
    .select("*")
    .eq("client_id", session.clientId)
    .neq("status", "Cancelled")
    .order("employee_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ staff: data || [] });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, role, department, manager, requiredDocs } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("onboarding")
    .insert({
      client_id: session.clientId,
      employee_name: name,
      email: email || null,
      phone: phone || null,
      role,
      department: department || null,
      manager: manager || null,
      start_date: new Date().toISOString().split("T")[0],
      notes: "Added as existing staff",
      status: "Complete",
      risk_level: "Low",
      employment_type: "existing_staff",
      missing_documents: requiredDocs?.length || 0,
      documents_required: requiredDocs?.length || 0,
      last_contacted: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert required documents (so Site Readiness tracks their tickets from day one)
  if (requiredDocs?.length && data?.id) {
    const docs = requiredDocs.map((docName: string) => ({
      client_id: session.clientId,
      onboarding_id: data.id,
      name: docName,
      required: true,
      received: false,
    }));
    await supabaseAdmin().from("documents").insert(docs);
  }

  // No welcome email, no n8n trigger — this person is already employed
  await supabaseAdmin().from("activity_log").insert({
    client_id: session.clientId,
    digital_employee: "AI Onboarding Assistant",
    action: `Existing staff added: ${name}`,
    details: `Role: ${role}${department ? ` · ${department}` : ""}`,
    status: "success",
  });

  return NextResponse.json({ success: true, id: data.id });
}
