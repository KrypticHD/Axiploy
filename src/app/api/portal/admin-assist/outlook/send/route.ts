import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { draftId, to, subject, body } = await req.json();
  if (!to || !subject || !body) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data: connection } = await supabaseAdmin()
    .from("admin_outlook_connections")
    .select("access_token, refresh_token, expires_at, client_id")
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!connection) return NextResponse.json({ error: "Outlook not connected" }, { status: 400 });

  let token = connection.access_token;
  if (connection.refresh_token) {
    const expiresAt = new Date(connection.expires_at).getTime();
    if (Date.now() >= expiresAt - 60_000) {
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
      if (res.ok && tokens.access_token) {
        token = tokens.access_token;
        await supabaseAdmin()
          .from("admin_outlook_connections")
          .update({ access_token: token, expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString() })
          .eq("client_id", connection.client_id);
      }
    }
  }

  const toAddresses = to.split(",").map((addr: string) => ({
    emailAddress: { address: addr.trim() },
  }));

  const sendRes = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "Text", content: body },
        toRecipients: toAddresses,
      },
      saveToSentItems: true,
    }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    return NextResponse.json({ error: `Failed to send: ${err}` }, { status: 500 });
  }

  if (draftId) {
    await supabaseAdmin()
      .from("admin_email_drafts")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", draftId)
      .eq("client_id", session.clientId);
  }

  return NextResponse.json({ success: true });
}
