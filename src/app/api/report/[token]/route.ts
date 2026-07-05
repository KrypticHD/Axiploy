import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, emailWrapper } from "@/lib/email";
import { classifyIncident } from "@/lib/incident-classification";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: client, error } = await supabaseAdmin()
    .from("clients")
    .select("id, name")
    .eq("report_token", token)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const formData = await req.formData();
  const description = (formData.get("description") as string | null)?.trim();
  const location = (formData.get("location") as string | null)?.trim() || null;
  const reportedByName = (formData.get("reportedByName") as string | null)?.trim() || null;
  const reportedByContact = (formData.get("reportedByContact") as string | null)?.trim() || null;
  const photo = formData.get("photo") as File | null;

  if (!description) {
    return NextResponse.json({ error: "Please describe what happened." }, { status: 400 });
  }

  let photoUrl: string | null = null;
  let photoBuffer: ArrayBuffer | null = null;
  let photoMimeType: string | null = null;

  if (photo) {
    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: "Please upload a photo (JPG, PNG, HEIC)." }, { status: 400 });
    }
    if (photo.size > MAX_SIZE) {
      return NextResponse.json({ error: "Photo too large. Maximum size is 10MB." }, { status: 400 });
    }

    photoBuffer = await photo.arrayBuffer();
    photoMimeType = photo.type;
    const ext = photo.name.split(".").pop() || "jpg";
    const storagePath = `${client.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin()
      .storage
      .from("safety-incident-photos")
      .upload(storagePath, Buffer.from(photoBuffer), { contentType: photo.type, upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabaseAdmin()
        .storage
        .from("safety-incident-photos")
        .getPublicUrl(storagePath);
      photoUrl = publicUrl;
    }
  }

  // AI Safety Assistant classifies the report — cautious fallback, never silently downgraded
  const classification = await classifyIncident(
    description,
    location,
    photoBuffer && photoMimeType ? { buffer: photoBuffer, mimeType: photoMimeType } : null
  );

  const { data: incident, error: insertError } = await supabaseAdmin()
    .from("safety_incidents")
    .insert({
      client_id: client.id,
      reported_by_name: reportedByName,
      reported_by_contact: reportedByContact,
      description,
      photo_url: photoUrl,
      location,
      incident_type: classification.incidentType,
      severity: classification.severity,
      notifiable: classification.notifiable,
      ai_summary: classification.summary,
      ai_suggested_actions: classification.suggestedActions,
      ai_confidence: classification.confidence,
      status: "new",
    })
    .select()
    .single();

  if (insertError || !incident) {
    return NextResponse.json({ error: "Failed to submit report. Please try again." }, { status: 500 });
  }

  await supabaseAdmin().from("activity_log").insert({
    client_id: client.id,
    digital_employee: "AI Safety Assistant",
    action: `New ${classification.incidentType.replace("_", " ")} reported — ${classification.severity} severity`,
    details: classification.summary,
    status: classification.severity === "high" || classification.severity === "critical" ? "warning" : "info",
  });

  const urgent = classification.severity === "high" || classification.severity === "critical" || classification.notifiable;

  // Immediate escalation — not batched — for urgent/notifiable incidents
  if (urgent) {
    const { data: agentRow } = await supabaseAdmin()
      .from("digital_employees")
      .select("config")
      .eq("client_id", client.id)
      .eq("type", "safety")
      .maybeSingle();

    const escalationContacts: string[] = agentRow?.config?.escalationContacts?.length
      ? agentRow.config.escalationContacts
      : [];

    if (escalationContacts.length === 0) {
      const { data: adminUser } = await supabaseAdmin()
        .from("users")
        .select("email")
        .eq("client_id", client.id)
        .eq("role", "client_admin")
        .maybeSingle();
      if (adminUser?.email) escalationContacts.push(adminUser.email);
    }

    const urgencyColor = classification.severity === "critical" ? "#ef4444" : "#f59e0b";
    const html = emailWrapper(`
      <div class="card" style="border-color:${urgencyColor}33">
        <div class="heading" style="color:${urgencyColor}">⚠️ ${classification.severity.toUpperCase()} — Safety incident reported</div>
        <div class="sub">${classification.incidentType.replace("_", " ")}${location ? ` · ${location}` : ""}</div>
        <div class="section-title">📋 AI-drafted summary</div>
        <p style="color:#e2e8f0;">${classification.summary}</p>
        ${classification.notifiable ? `<div class="item"><div class="dot" style="background:${urgencyColor}"></div><div><strong style="color:#fff">This may require regulator notification.</strong></div></div>` : ""}
        ${reportedByName ? `<div class="item"><div class="dot dot-grey"></div><div>Reported by: ${reportedByName}</div></div>` : `<div class="item"><div class="dot dot-grey"></div><div>Reported anonymously</div></div>`}
        <p style="margin-top:16px">Please review this immediately in the portal.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://axiploy.vercel.app"}/portal/inbox" class="btn">Review now →</a>
      </div>
      <p style="text-align:center;font-size:12px;color:#475569;margin-top:8px;">
        Sent by your AI Safety Assistant · immediate escalation
      </p>
    `);

    for (const to of escalationContacts) {
      sendEmail({
        to,
        subject: `⚠️ ${classification.severity.toUpperCase()}: Safety incident reported${location ? ` — ${location}` : ""}`,
        html,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, urgent });
}
