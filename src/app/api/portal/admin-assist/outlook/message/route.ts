import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function getToken(clientId: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("admin_outlook_connections")
    .select("access_token, refresh_token, expires_at, client_id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!data) return null;

  let token = data.access_token;
  if (data.refresh_token && new Date(data.expires_at).getTime() < Date.now() + 60_000) {
    const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: data.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const tokens = await res.json();
    if (res.ok && tokens.access_token) {
      token = tokens.access_token;
      await supabaseAdmin()
        .from("admin_outlook_connections")
        .update({ access_token: token, expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString() })
        .eq("client_id", data.client_id);
    }
  }
  return token;
}

// GET full email body
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("id");
  if (!messageId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const token = await getToken(session.clientId);
  if (!token) return NextResponse.json({ error: "Outlook not connected" }, { status: 400 });

  const [msgRes, markRes] = await Promise.all([
    fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,body,isRead`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Mark as read
    fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }),
  ]);

  if (!msgRes.ok) return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 });

  const msg = await msgRes.json();
  return NextResponse.json({
    id: msg.id,
    subject: msg.subject,
    from: msg.from?.emailAddress,
    to: msg.toRecipients?.map((r: { emailAddress: { name: string; address: string } }) => r.emailAddress) || [],
    cc: msg.ccRecipients?.map((r: { emailAddress: { name: string; address: string } }) => r.emailAddress) || [],
    receivedAt: msg.receivedDateTime,
    body: msg.body?.content || "",
    bodyType: msg.body?.contentType || "text",
  });
}

// POST reply to email
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId, comment } = await req.json();
  if (!messageId || !comment?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const token = await getToken(session.clientId);
  if (!token) return NextResponse.json({ error: "Outlook not connected" }, { status: 400 });

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}/reply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
