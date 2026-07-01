import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const clientId = searchParams.get("state"); // we passed clientId as state
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (error || !code || !clientId) {
    return NextResponse.redirect(`${appUrl}/portal/admin-assist/emails?outlook_error=true`);
  }

  const redirectUri = `${appUrl}/api/portal/admin-assist/outlook/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.redirect(`${appUrl}/portal/admin-assist/emails?outlook_error=true`);
  }

  // Fetch user email from Graph
  const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const me = await meRes.json();

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabaseAdmin()
    .from("admin_outlook_connections")
    .upsert({
      client_id: clientId,
      email: me.mail || me.userPrincipalName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt,
    }, { onConflict: "client_id" });

  return NextResponse.redirect(`${appUrl}/portal/admin-assist/emails?outlook_connected=true`);
}
