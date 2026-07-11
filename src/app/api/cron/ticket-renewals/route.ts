import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, emailWrapper } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all auto-approved documents with an expiry date, joined to their worker
  const { data: docs } = await supabase
    .from("documents")
    .select("*, onboarding:onboarding_id(employee_name, email, token)")
    .eq("validation_status", "auto_approved")
    .not("expiry_date", "is", null)
    .gte("expiry_date", today.toISOString().split("T")[0]);

  if (!docs?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  const reminderThresholds = [30, 14, 7, 1];

  for (const doc of docs) {
    const ob = doc.onboarding as { employee_name: string; email: string | null; token: string } | null;
    if (!ob?.email) continue;

    const expiry = new Date(doc.expiry_date);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / 86400000);

    const matchedThreshold = reminderThresholds.find((t) => daysLeft === t);
    if (!matchedThreshold) continue;

    const { data: alreadySent } = await supabase
      .from("document_renewal_reminders_sent")
      .select("id")
      .eq("document_id", doc.id)
      .eq("days_before", matchedThreshold)
      .maybeSingle();

    if (alreadySent) continue;

    const urgencyColor = daysLeft <= 7 ? "#ef4444" : daysLeft <= 14 ? "#f59e0b" : "#3b82f6";
    const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://axiploy.vercel.app"}/onboard/${ob.token}`;

    const html = emailWrapper(`
      <div class="card" style="border-color:${urgencyColor}33">
        <div class="heading" style="color:${urgencyColor}">
          ${daysLeft === 1 ? "⚠️ Expires tomorrow" : daysLeft <= 7 ? `⚠️ Expires in ${daysLeft} days` : `📋 Renewal reminder — ${daysLeft} days`}
        </div>
        <div class="sub">Hi ${ob.employee_name.split(" ")[0]}, your ${doc.name} needs renewing soon.</div>

        <div class="section-title">📄 Ticket Details</div>
        <div class="item"><div class="dot" style="background:${urgencyColor}"></div><div><strong style="color:#fff">${doc.name}</strong></div></div>
        <div class="item"><div class="dot dot-grey"></div><div>Expiry: <strong style="color:#fff">${new Date(doc.expiry_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</strong></div></div>

        <p style="margin-top:16px">Please upload a copy of your renewed ticket as soon as you have it, so you stay site-ready.</p>
        <a href="${portalLink}" class="btn">Upload renewed ticket →</a>
      </div>
      <p style="text-align:center;font-size:12px;color:#475569;margin-top:8px;">
        Sent by your AI Onboarding Assistant · ${matchedThreshold} day${matchedThreshold !== 1 ? "s" : ""} notice
      </p>
    `);

    const result = await sendEmail({
      to: ob.email,
      subject: `${daysLeft <= 1 ? "⚠️ URGENT: " : daysLeft <= 7 ? "⚠️ " : ""}Your ${doc.name} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      html,
    });

    if (!result.ok) {
      await supabase.from("activity_log").insert({
        client_id: doc.client_id,
        digital_employee: "AI Onboarding Assistant",
        action: `Reminder failed: Ticket renewal — ${doc.name}`,
        details: `Delivery to ${ob.email} failed for ${ob.employee_name}`,
        status: "error",
      });
      continue;
    }

    await supabase.from("document_renewal_reminders_sent").insert({
      document_id: doc.id,
      days_before: matchedThreshold,
    });

    await supabase.from("activity_log").insert({
      client_id: doc.client_id,
      digital_employee: "AI Onboarding Assistant",
      action: `Ticket renewal reminder sent: ${doc.name}`,
      details: `${ob.employee_name} · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} until expiry · ${matchedThreshold}-day notice`,
      status: daysLeft <= 7 ? "warning" : "success",
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
