import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { id: string; clientId: string; name: string; clientName: string };
  try {
    session = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { type, priority, subject, description } = await req.json();
  if (!type || !subject || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("support_requests")
    .insert({
      client_id: session.clientId,
      user_id: session.id,
      type,
      priority: priority || "Medium",
      subject,
      description,
      status: "open",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify via Resend
  const refId = `AXI-${data.id.slice(0, 8).toUpperCase()}`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@axiploy.com",
        to: "cainbrammer2@hotmail.com",
        subject: `[${priority}] Support Request — ${subject}`,
        html: `<p><strong>From:</strong> ${session.name} (${session.clientName})</p><p><strong>Type:</strong> ${type}</p><p><strong>Priority:</strong> ${priority}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Description:</strong></p><p>${description}</p><p><strong>Ref:</strong> ${refId}</p>`,
      }),
    });
  } catch {}

  return NextResponse.json({ success: true, refId });
}
