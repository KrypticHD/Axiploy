import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, emailWrapper } from "@/lib/email";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, role, department, manager, startDate, notes, requiredDocs } = body;

  const { data, error } = await supabaseAdmin()
    .from("onboarding")
    .insert({
      client_id: session.clientId,
      employee_name: name,
      email,
      phone,
      role,
      department,
      manager,
      start_date: startDate,
      notes,
      status: "Not Started",
      risk_level: "Low",
      missing_documents: requiredDocs?.length || 0,
      documents_required: requiredDocs?.length || 0,
      last_contacted: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert required documents
  if (requiredDocs?.length && data?.id) {
    const docs = requiredDocs.map((docName: string) => ({
      client_id: session.clientId,
      onboarding_id: data.id,
      name: docName,
      required: true,
      received: false,
    }));
    await supabaseAdmin().from("documents").insert(docs);
  }

  // Log activity
  await supabaseAdmin().from("activity_log").insert({
    client_id: session.clientId,
    digital_employee: "AI Onboarding Assistant",
    action: `New employee added: ${name}`,
    details: `Role: ${role} · Start: ${new Date(startDate).toLocaleDateString("en-AU")}`,
    status: "success",
  });

  // Send welcome email to the new employee (fire-and-forget)
  if (email) {
    const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://axiploy.vercel.app"}/onboard/${data.token}`;
    const startFormatted = new Date(startDate).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const docsHtml = (requiredDocs || []).map((d: string) => `<div class="item"><div class="dot dot-grey"></div><div>${d}</div></div>`).join("");

    sendEmail({
      to: email,
      subject: `Welcome to the team, ${name.split(" ")[0]}! — Next steps for your onboarding`,
      html: emailWrapper(`
        <div class="card">
          <div class="heading">Welcome, ${name.split(" ")[0]}! 🎉</div>
          <div class="sub">We're excited to have you joining as ${role}${department ? ` in ${department}` : ""}.</div>
          <p>Your start date is <strong style="color:#fff">${startFormatted}</strong>. Your manager ${manager ? `<strong style="color:#fff">${manager}</strong>` : ""} has been notified and is expecting you.</p>
          ${requiredDocs?.length ? `
            <div class="section-title">📄 Documents needed before you start</div>
            ${docsHtml}
            <p>Please upload these as soon as possible so we can get everything ready for day one.</p>
            <a href="${portalLink}" class="btn">Upload Your Documents →</a>
          ` : `
            <p>Everything looks good — we'll be in touch with more details closer to your start date.</p>
          `}
        </div>
        <p style="text-align:center;font-size:12px;color:#475569;margin-top:8px;">
          This email was sent by the AI Onboarding Assistant. Questions? Reply to this email.
        </p>
      `),
    }).catch(() => {});

    // Log the welcome email action
    supabaseAdmin().from("activity_log").insert({
      client_id: session.clientId,
      digital_employee: "AI Onboarding Assistant",
      action: `Welcome email sent: ${name}`,
      details: `${requiredDocs?.length || 0} documents requested`,
      status: "success",
    }).then(() => {});
  }

  // Fire n8n onboarding workflow
  try {
    await fetch("https://n8n-production-2d9a4.up.railway.app/webhook/axiploy-onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": "xK9mP2vQ8nR5tL3wY7jH4cF6bD1sA0eG",
      },
      body: JSON.stringify({
        clientId: session.clientId,
        onboardingId: data.id,
        token: data.token,
        name, email, phone, role, department, manager, startDate, notes,
        requiredDocs: requiredDocs || [],
      }),
    });
  } catch {
    // Don't fail the request if n8n is unreachable
  }

  return NextResponse.json({ success: true, id: data.id });
}
