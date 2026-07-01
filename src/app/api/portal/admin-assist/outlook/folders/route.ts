import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connection } = await supabaseAdmin()
    .from("admin_outlook_connections")
    .select("access_token, refresh_token, expires_at, client_id")
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!connection) return NextResponse.json({ error: "Outlook not connected" }, { status: 400 });

  let token = connection.access_token;
  if (connection.refresh_token && new Date(connection.expires_at).getTime() < Date.now() + 60_000) {
    const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const tokens = await res.json();
    if (res.ok && tokens.access_token) token = tokens.access_token;
  }

  const graphRes = await fetch(
    "https://graph.microsoft.com/v1.0/me/mailFolders?$top=50&$select=id,displayName,unreadItemCount,totalItemCount",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!graphRes.ok) return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });

  const data = await graphRes.json();
  return NextResponse.json({ folders: data.value || [] });
}
