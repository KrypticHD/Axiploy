import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId as string; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ approvals: [] });

  const { data } = await supabaseAdmin()
    .from("approvals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ approvals: data || [] });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, status } = await req.json();

  const { error } = await supabaseAdmin()
    .from("approvals")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
