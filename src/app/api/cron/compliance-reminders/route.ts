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

  // Fetch all non-expired compliance items with expiry dates
  const { data: items } = await supabase
    .from("compliance_items")
    .select("*, clients!compliance_items_client_id_fkey(name)")
    .not("expiry_date", "is", null)
    .gte("expiry_date", today.toISOString().split("T")[0]);

  if (!items?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  const reminderThresholds = [30, 14, 7, 1];

  for (const item of items) {
    const expiry = new Date(item.expiry_date);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / 86400000);
    const reminderDays: number[] = item.reminder_days || [30, 14, 7];

    // Check if today matches a reminder threshold for this item
    const matchedThreshold = reminderThresholds.find(
      (t) => reminderDays.includes(t) && daysLeft === t
    );
    if (!matchedThreshold) continue;

    // Check we haven't already sent this reminder
    const { data: alreadySent } = await supabase
      .from("compliance_reminders_sent")
      .select("id")
      .eq("compliance_item_id", item.id)
      .eq("days_before", matchedThreshold)
      .maybeSingle();

    if (alreadySent) continue;

    // Get the client admin email
    const { data: adminUser } = await supabase
      .from("users")
      .select("email, name")
      .eq("client_id", item.client_id)
      .eq("role", "client_admin")
      .maybeSingle();

    if (!adminUser?.email) continue;

    const urgency = daysLeft <= 7 ? "critical" : daysLeft <= 14 ? "urgent" : "soon";
    const urgencyColor = daysLeft <= 7 ? "#ef4444" : daysLeft <= 14 ? "#f59e0b" : "#3b82f6";
    const clientName = (item.clients as unknown as { name: string } | null)?.name || "your business";
    const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://axiploy.vercel.app"}/portal/compliance`;

    const html = emailWrapper(`
      <div class="card" style="border-color:${urgencyColor}33">
        <div class="heading" style="color:${urgencyColor}">
          ${daysLeft === 1 ? "⚠️ Expires tomorrow" : daysLeft <= 7 ? `⚠️ Expires in ${daysLeft} days` : `📋 Renewal reminder — ${daysLeft} days`}
        </div>
        <div class="sub">${item.title} is due for renewal.</div>

        <div class="section-title">📄 Item Details</div>
        <div class="item"><div class="dot" style="background:${urgencyColor}"></div><div><strong style="color:#fff">${item.title}</strong></div></div>
        <div class="item"><div class="dot dot-grey"></div><div>Category: ${item.category}</div></div>
        <div class="item"><div class="dot dot-grey"></div><div>Expiry: <strong style="color:#fff">${new Date(item.expiry_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</strong></div></div>
        ${item.assigned_to ? `<div class="item"><div class="dot dot-grey"></div><div>Assigned to: ${item.assigned_to}</div></div>` : ""}
        ${item.description ? `<div class="item"><div class="dot dot-grey"></div><div>${item.description}</div></div>` : ""}

        <p style="margin-top:16px">Please action this renewal to keep ${clientName} compliant. Once renewed, update the expiry date in your compliance register.</p>
        <a href="${portalLink}" class="btn">View Compliance Register →</a>
      </div>
      <p style="text-align:center;font-size:12px;color:#475569;margin-top:8px;">
        Sent by your AI Compliance Assistant · ${matchedThreshold} day${matchedThreshold !== 1 ? "s" : ""} notice
      </p>
    `);

    await sendEmail({
      to: adminUser.email,
      subject: `${daysLeft <= 1 ? "⚠️ URGENT: " : daysLeft <= 7 ? "⚠️ " : ""}${item.title} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      html,
    });

    // Record that we sent this reminder
    await supabase.from("compliance_reminders_sent").insert({
      compliance_item_id: item.id,
      days_before: matchedThreshold,
    });

    await supabase.from("activity_log").insert({
      client_id: item.client_id,
      digital_employee: "AI Compliance Assistant",
      action: `Compliance reminder sent: ${item.title}`,
      details: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} until expiry · ${matchedThreshold}-day notice`,
      status: daysLeft <= 7 ? "warning" : "success",
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
