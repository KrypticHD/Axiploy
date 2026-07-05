import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, emailWrapper } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

const OVERDUE_BUCKETS = [1, 3, 7, 14];

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: actions } = await supabase
    .from("corrective_actions")
    .select("*, incidents:incident_id(incident_type)")
    .eq("status", "open")
    .not("due_date", "is", null)
    .lt("due_date", today.toISOString().split("T")[0]);

  if (!actions?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const action of actions) {
    const daysOverdue = Math.floor((today.getTime() - new Date(action.due_date).getTime()) / 86400000);
    const matchedBucket = OVERDUE_BUCKETS.find((b) => daysOverdue === b);
    if (!matchedBucket) continue;

    const { data: alreadySent } = await supabase
      .from("corrective_action_reminders_sent")
      .select("id")
      .eq("corrective_action_id", action.id)
      .eq("days_overdue", matchedBucket)
      .maybeSingle();

    if (alreadySent) continue;

    let recipientEmail = action.assigned_email as string | null;
    if (!recipientEmail) {
      const { data: adminUser } = await supabase
        .from("users")
        .select("email")
        .eq("client_id", action.client_id)
        .eq("role", "client_admin")
        .maybeSingle();
      recipientEmail = adminUser?.email || null;
    }

    if (!recipientEmail) continue;

    const incidentType = ((action.incidents as { incident_type?: string } | null)?.incident_type || "incident").replace("_", " ");
    const urgencyColor = daysOverdue >= 7 ? "#ef4444" : "#f59e0b";

    const html = emailWrapper(`
      <div class="card" style="border-color:${urgencyColor}33">
        <div class="heading" style="color:${urgencyColor}">⚠️ Corrective action overdue — ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}</div>
        <div class="sub">${action.description}</div>
        <div class="item"><div class="dot" style="background:${urgencyColor}"></div><div>Related to: ${incidentType}</div></div>
        <div class="item"><div class="dot dot-grey"></div><div>Was due: ${new Date(action.due_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</div></div>
        <p style="margin-top:16px">Please action this and mark it complete in the Safety Register.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://axiploy.vercel.app"}/portal/safety" class="btn">Open Safety Register →</a>
      </div>
      <p style="text-align:center;font-size:12px;color:#475569;margin-top:8px;">
        Sent by your AI Safety Assistant
      </p>
    `);

    const result = await sendEmail({
      to: recipientEmail,
      subject: `⚠️ Overdue: ${action.description}`,
      html,
    });

    if (!result.ok) continue;

    await supabase.from("corrective_action_reminders_sent").insert({
      corrective_action_id: action.id,
      days_overdue: matchedBucket,
    });

    await supabase.from("activity_log").insert({
      client_id: action.client_id,
      digital_employee: "AI Safety Assistant",
      action: `Overdue corrective action reminder sent: ${action.description}`,
      details: `${daysOverdue} days overdue`,
      status: "warning",
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
