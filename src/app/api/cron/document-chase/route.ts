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

  // Find onboarding records with missing documents, not complete, created > 2 days ago
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const { data: overdue } = await supabase
    .from("onboarding")
    .select("id, client_id, employee_name, email, role, manager, missing_documents, last_contacted, token")
    .gt("missing_documents", 0)
    .neq("status", "Complete")
    .lt("last_contacted", twoDaysAgo);

  if (!overdue?.length) return NextResponse.json({ chased: 0 });

  let chased = 0;

  for (const record of overdue) {
    if (!record.email) continue;
    try {
      // Get the missing document names
      const { data: docs } = await supabase
        .from("documents")
        .select("name")
        .eq("onboarding_id", record.id)
        .eq("received", false);

      const missingNames = (docs || []).map((d) => d.name);
      const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://axiploy.vercel.app"}/onboard/${record.token}`;

      const html = emailWrapper(`
        <div class="card">
          <div class="heading">Quick reminder, ${record.employee_name.split(" ")[0]} 👋</div>
          <div class="sub">We still need a few documents to complete your onboarding.</div>
          <div class="section-title">📄 Still waiting on</div>
          ${missingNames.map((name) => `<div class="item"><div class="dot dot-amber"></div><div>${name}</div></div>`).join("")}
          <p>Once you've uploaded these, your onboarding will be complete and your manager will be notified automatically.</p>
          <a href="${portalLink}" class="btn">Upload Documents →</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#475569;margin-top:8px;">
          This reminder was sent by the AI Onboarding Assistant on behalf of ${record.manager || "your manager"}.
        </p>
      `);

      await sendEmail({
        to: record.email,
        subject: `Reminder: ${record.missing_documents} document${record.missing_documents !== 1 ? "s" : ""} still needed for your onboarding`,
        html,
      });

      // Update last_contacted so we don't spam them
      await supabase.from("onboarding").update({ last_contacted: new Date().toISOString() }).eq("id", record.id);

      await supabase.from("activity_log").insert({
        client_id: record.client_id,
        digital_employee: "AI Onboarding Assistant",
        action: `Document reminder sent: ${record.employee_name}`,
        details: `${record.missing_documents} documents still missing · to ${record.email}`,
        status: "success",
      });

      chased++;
    } catch (err) {
      await supabase.from("activity_log").insert({
        client_id: record.client_id,
        digital_employee: "AI Onboarding Assistant",
        action: `Reminder failed: ${record.employee_name}`,
        details: `Delivery to ${record.email} failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        status: "error",
      });
    }
  }

  return NextResponse.json({ chased });
}
