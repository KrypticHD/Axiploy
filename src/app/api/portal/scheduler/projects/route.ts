import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).clientId || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data || [] });
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, site_location, contact_name, contact_email, contact_phone, budget, start_date, end_date, notes } = body;

  if (!name) return NextResponse.json({ error: "Project name required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("projects")
    .insert({
      client_id: clientId,
      name,
      site_location: site_location || null,
      contact_name: contact_name || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      budget: budget || null,
      status: "planning",
      start_date: start_date || null,
      end_date: end_date || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "Scheduler",
    action: `Project created: ${name}`,
    details: site_location ? `Site: ${site_location}` : "",
    status: "success",
  });

  return NextResponse.json({ project: data });
}
