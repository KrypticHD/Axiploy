import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function refreshIfNeeded(connection: { client_id: string; access_token: string; refresh_token: string | null; expires_at: string }) {
  if (!connection.refresh_token) return connection.access_token;
  const expiresAt = new Date(connection.expires_at).getTime();
  if (Date.now() < expiresAt - 60_000) return connection.access_token;

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
  if (!res.ok || !tokens.access_token) return connection.access_token;

  const expiresAt2 = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await supabaseAdmin()
    .from("admin_outlook_connections")
    .update({ access_token: tokens.access_token, expires_at: expiresAt2 })
    .eq("client_id", connection.client_id);

  return tokens.access_token as string;
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connection } = await supabaseAdmin()
    .from("admin_outlook_connections")
    .select("client_id, access_token, refresh_token, expires_at")
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!connection) return NextResponse.json({ error: "Outlook not connected" }, { status: 400 });

  const token = await refreshIfNeeded(connection);

  const { searchParams } = new URL(req.url);
  const skipToken = searchParams.get("skipToken");

  const baseUrl = "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead";
  const fetchUrl = skipToken ? `${baseUrl}&$skiptoken=${encodeURIComponent(skipToken)}` : baseUrl;

  const graphRes = await fetch(fetchUrl, { headers: { Authorization: `Bearer ${token}` } });

  if (!graphRes.ok) {
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }

  const graphData = await graphRes.json();
  const emails: { id: string; subject: string; from: { emailAddress: { name: string; address: string } }; receivedDateTime: string; bodyPreview: string; isRead: boolean }[] = graphData.value || [];

  // Extract next page token from @odata.nextLink
  const nextLink: string | null = graphData["@odata.nextLink"] || null;
  let nextSkipToken: string | null = null;
  if (nextLink) {
    const match = nextLink.match(/\$skiptoken=([^&]+)/i);
    if (match) nextSkipToken = decodeURIComponent(match[1]);
  }

  let triaged = emails.map((e) => ({
    id: e.id,
    subject: e.subject,
    from: e.from?.emailAddress?.name || e.from?.emailAddress?.address || "Unknown",
    fromEmail: e.from?.emailAddress?.address || "",
    receivedAt: e.receivedDateTime,
    preview: e.bodyPreview,
    isRead: e.isRead,
    priority: "fyi" as string,
    aiLabel: null as string | null,
    aiAction: null as string | null,
  }));

  if (process.env.ANTHROPIC_API_KEY && emails.length > 0) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const emailList = emails.slice(0, 10).map((e, i) =>
        `${i + 1}. From: ${e.from?.emailAddress?.name} <${e.from?.emailAddress?.address}>\nSubject: ${e.subject}\nPreview: ${e.bodyPreview?.slice(0, 150)}`
      ).join("\n\n");

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: `Triage these emails for a business owner. For each email assign: priority (urgent/important/follow_up/fyi/junk), a short label (max 5 words), and a suggested action (max 8 words).

Priority rules:
- urgent: verification codes, OTP codes, security alerts, password resets, account access, anything time-sensitive
- important: emails needing a reply, invoices, contracts, client emails, anything business-related
- follow_up: newsletters you might act on, meeting follow-ups, quotes
- fyi: receipts, notifications, confirmations that need no action
- junk: marketing, promotions, ads, spam (NEVER put verification codes or security emails here)

${emailList}

Respond ONLY with a JSON array matching the email order: [{"priority":"urgent","label":"Client needs response","action":"Reply within 2 hours"},...]`,
        }],
      });

      const raw = (response.content[0] as { type: string; text: string }).text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(raw);
      triaged = triaged.map((e, i) => ({
        ...e,
        priority: parsed[i]?.priority || "fyi",
        aiLabel: parsed[i]?.label || null,
        aiAction: parsed[i]?.action || null,
      }));
    } catch {
      // Triage failed — return without AI labels
    }
  }

  return NextResponse.json({ emails: triaged, nextSkipToken });
}
