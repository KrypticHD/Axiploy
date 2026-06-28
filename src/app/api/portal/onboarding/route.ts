import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, role, department, manager, startDate, notes, requiredDocs } = body;

  const { data, error } = await supabaseAdmin()
    .from("onboarding")
    .insert({
      client_id: session.clientId,
      employee_name: name,
      email,
      phone,
      role,
      department,
      manager,
      start_date: startDate,
      notes,
      status: "Not Started",
      risk_level: "Low",
      missing_documents: requiredDocs?.length || 0,
      documents_required: requiredDocs?.length || 0,
      last_contacted: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert required documents into documents table
  if (requiredDocs?.length && data?.id) {
    const docs = requiredDocs.map((name: string) => ({
      client_id: session.clientId,
      onboarding_id: data.id,
      name,
      required: true,
      received: false,
    }));
    await supabaseAdmin().from("documents").insert(docs);
  }

  // Log activity
  await supabaseAdmin().from("activity_log").insert({
    client_id: session.clientId,
    digital_employee: "AI Onboarding Assistant",
    action: `New employee added: ${name}`,
    details: `Role: ${role} · Start: ${new Date(startDate).toLocaleDateString("en-AU")}`,
    status: "success",
  });

  return NextResponse.json({ success: true, id: data.id });
}
