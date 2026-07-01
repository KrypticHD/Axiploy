import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ connected: false });

  const { data } = await supabaseAdmin()
    .from("admin_outlook_connections")
    .select("email, expires_at, connected_at")
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!data) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: true,
    email: data.email,
    connectedAt: data.connected_at,
  });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabaseAdmin()
    .from("admin_outlook_connections")
    .delete()
    .eq("client_id", session.clientId);

  return NextResponse.json({ success: true });
}
