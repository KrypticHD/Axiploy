import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ drafts: [] });

  const { data } = await supabaseAdmin()
    .from("admin_email_drafts")
    .select("*")
    .eq("client_id", session.clientId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ drafts: data || [] });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { emailType, toRecipients, context, tone } = await req.json();
  if (!emailType) return NextResponse.json({ error: "emailType required" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI drafting not configured — add ANTHROPIC_API_KEY" }, { status: 503 });
  }

  // Fetch agent config for signature / tone preferences
  const { data: agentData } = await supabaseAdmin()
    .from("digital_employees")
    .select("config")
    .eq("client_id", session.clientId)
    .eq("type", "admin")
    .single();

  const agentConfig = agentData?.config || {};
  const signature = agentConfig.emailSignature || "";
  const companyName = session.clientName || "our company";

  const typeDescriptions: Record<string, string> = {
    follow_up: "a professional follow-up email",
    meeting_request: "a meeting request email",
    thank_you: "a thank-you email",
    reminder: "a polite reminder email",
    report_summary: "a business report summary email",
    custom: "a professional business email",
  };

  const prompt = `Write ${typeDescriptions[emailType] || "a professional email"} for ${companyName}.
${toRecipients ? `To: ${toRecipients}` : ""}
${context ? `Context: ${context}` : ""}
Tone: ${tone || agentConfig.emailTone || "Professional"}
${signature ? `Signature to use: ${signature}` : ""}

Return ONLY valid JSON in this format:
{
  "subject": "email subject line",
  "body": "full email body text"
}

Write the email in plain text (no markdown). Keep it concise and professional.`;

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let draft: { subject: string; body: string };
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    draft = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Failed to generate email draft" }, { status: 500 });
  }

  const { data: saved, error } = await supabaseAdmin()
    .from("admin_email_drafts")
    .insert({
      client_id: session.clientId,
      subject: draft.subject,
      body: draft.body,
      to_recipients: toRecipients || "",
      email_type: emailType,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: saved });
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (updates.status === "sent") updates.sent_at = new Date().toISOString();

  const { error } = await supabaseAdmin()
    .from("admin_email_drafts")
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
    .from("admin_email_drafts")
    .delete()
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
