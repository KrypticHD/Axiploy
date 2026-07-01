import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ tasks: [] });

  const { data } = await supabaseAdmin()
    .from("admin_tasks")
    .select("*")
    .eq("client_id", session.clientId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ tasks: data || [] });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { title, description, assigned_to, priority, due_date } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("admin_tasks")
    .insert({ client_id: session.clientId, title, description, assigned_to, priority: priority || "medium", due_date, created_by: session.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (updates.status === "completed") updates.completed_at = new Date().toISOString();

  const { error } = await supabaseAdmin()
    .from("admin_tasks")
    .update(updates)
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin()
    .from("admin_tasks")
    .delete()
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
