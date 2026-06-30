import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (session?.role !== "axiploy_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const { name, type } = await req.json();

  if (!name || !type) return NextResponse.json({ error: "Missing name or type" }, { status: 400 });

  const roleMap: Record<string, string> = {
    onboarding: "Onboarding",
    admin: "Admin",
    growth: "Growth",
  };

  const { error } = await supabaseAdmin().from("digital_employees").insert({
    client_id: clientId,
    name,
    type,
    role: roleMap[type] || type,
    status: "Active",
    tasks_completed: 0,
    hours_saved: 0,
    success_rate: 100,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (session?.role !== "axiploy_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const { agentId, config } = await req.json();

  if (!agentId || !config) return NextResponse.json({ error: "Missing agentId or config" }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from("digital_employees")
    .update({ config })
    .eq("id", agentId)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (session?.role !== "axiploy_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const { agentId } = await req.json();

  const { error } = await supabaseAdmin()
    .from("digital_employees")
    .delete()
    .eq("id", agentId)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
