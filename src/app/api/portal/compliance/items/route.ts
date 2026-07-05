import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId as string || null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ items: [] });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  let query = supabaseAdmin()
    .from("compliance_items")
    .select("*, staff:staff_id(employee_name)")
    .eq("client_id", clientId)
    .order("expiry_date", { ascending: true, nullsFirst: false });

  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compute live status for each item based on expiry_date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const items = (data || []).map((item) => {
    const staffName = (item.staff as unknown as { employee_name?: string } | null)?.employee_name || null;
    const base = { ...item, staffName };
    if (!item.expiry_date) return { ...base, status: "no_expiry", daysUntilExpiry: null };
    const expiry = new Date(item.expiry_date);
    const diff = Math.floor((expiry.getTime() - today.getTime()) / 86400000);
    let computedStatus = "current";
    if (diff < 0) computedStatus = "expired";
    else if (diff <= 7) computedStatus = "critical";
    else if (diff <= 30) computedStatus = "expiring_soon";
    return { ...base, status: computedStatus, daysUntilExpiry: diff };
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { title, category, description, assigned_to, staff_id, expiry_date, reminder_days, notes } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("compliance_items")
    .insert({
      client_id: clientId,
      title,
      category: category || "Other",
      description,
      assigned_to,
      staff_id: staff_id || null,
      expiry_date: expiry_date || null,
      reminder_days: reminder_days || [30, 14, 7],
      notes,
      status: "current",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "AI Compliance Assistant",
    action: `Compliance item added: ${title}`,
    details: `${category || "Other"}${expiry_date ? ` · Expires ${new Date(expiry_date).toLocaleDateString("en-AU")}` : ""}`,
    status: "success",
  });

  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("compliance_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin()
    .from("compliance_items")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
