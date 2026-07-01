import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, emailWrapper } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  // Get all clients who have an admin agent and a user email
  const { data: adminAgents } = await supabase
    .from("digital_employees")
    .select("client_id, name")
    .eq("type", "admin")
    .eq("status", "Active");

  if (!adminAgents?.length) return NextResponse.json({ sent: 0 });

  const clientIds = [...new Set(adminAgents.map((a) => a.client_id))];

  // Get user emails and client names
  const { data: users } = await supabase
    .from("users")
    .select("email, name, client_id, clients(name)")
    .in("client_id", clientIds)
    .eq("role", "client_admin");

  if (!users?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const user of users) {
    try {
      const clientId = user.client_id;
      const clientName = (user.clients as unknown as { name: string } | null)?.name || "Your Company";
      const firstName = user.name?.split(" ")[0] || "there";

      // Gather data in parallel
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const [tasksRes, meetingsRes, approvalsRes, onboardingRes, emailDraftsRes, socialPostsRes] = await Promise.all([
        supabase.from("admin_tasks").select("id, title, priority, due_date, status").eq("client_id", clientId).neq("status", "done").order("due_date", { ascending: true }).limit(5),
        supabase.from("admin_meetings").select("id, title, start_time, location").eq("client_id", clientId).gte("start_time", todayIso).lt("start_time", new Date(today.getTime() + 86400000).toISOString()).order("start_time"),
        supabase.from("approvals").select("id").eq("client_id", clientId).eq("status", "pending"),
        supabase.from("onboarding").select("id, employee_name, status, risk_level, missing_documents").eq("client_id", clientId).neq("status", "Complete"),
        supabase.from("admin_email_drafts").select("id").eq("client_id", clientId).eq("status", "draft"),
        supabase.from("social_posts").select("id").eq("client_id", clientId).eq("status", "approved"),
      ]);

      const tasks = tasksRes.data || [];
      const meetings = meetingsRes.data || [];
      const approvals = approvalsRes.data?.length || 0;
      const activeOnboarding = onboardingRes.data || [];
      const highRisk = activeOnboarding.filter((o) => o.risk_level === "High" || o.risk_level === "Critical");
      const pendingDrafts = emailDraftsRes.data?.length || 0;
      const readyPosts = socialPostsRes.data?.length || 0;

      const urgentTasks = tasks.filter((t) => t.priority === "urgent");
      const dateStr = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

      // Build email HTML
      const statsHtml = `
        <div class="stat-row">
          <div class="stat">
            <div class="stat-val">${tasks.length}</div>
            <div class="stat-lbl">Open Tasks</div>
          </div>
          <div class="stat">
            <div class="stat-val">${meetings.length}</div>
            <div class="stat-lbl">Meetings Today</div>
          </div>
          <div class="stat">
            <div class="stat-val">${approvals}</div>
            <div class="stat-lbl">Pending Approvals</div>
          </div>
          <div class="stat">
            <div class="stat-val">${activeOnboarding.length}</div>
            <div class="stat-lbl">Active Onboardings</div>
          </div>
        </div>`;

      const alertsHtml = urgentTasks.length > 0 || highRisk.length > 0 || approvals > 0 ? `
        <div class="section-title">⚡ Needs Attention</div>
        ${urgentTasks.map((t) => `<div class="item"><div class="dot dot-red"></div><div>${t.title} <span class="badge badge-urgent">Urgent</span></div></div>`).join("")}
        ${highRisk.map((o) => `<div class="item"><div class="dot dot-amber"></div><div>${o.employee_name} — ${o.missing_documents} doc${o.missing_documents !== 1 ? "s" : ""} missing <span class="badge badge-important">High Risk</span></div></div>`).join("")}
        ${approvals > 0 ? `<div class="item"><div class="dot dot-amber"></div><div>${approvals} approval${approvals !== 1 ? "s" : ""} waiting for your review</div></div>` : ""}
      ` : "";

      const meetingsHtml = meetings.length > 0 ? `
        <div class="section-title">📅 Today's Meetings</div>
        ${meetings.map((m) => `<div class="item"><div class="dot dot-blue"></div><div>${new Date(m.start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })} — ${m.title}${m.location ? ` · ${m.location}` : ""}</div></div>`).join("")}
      ` : "";

      const queueHtml = pendingDrafts > 0 || readyPosts > 0 ? `
        <div class="section-title">📋 Your AI Queue</div>
        ${pendingDrafts > 0 ? `<div class="item"><div class="dot dot-grey"></div><div>${pendingDrafts} email draft${pendingDrafts !== 1 ? "s" : ""} ready to review</div></div>` : ""}
        ${readyPosts > 0 ? `<div class="item"><div class="dot dot-green"></div><div>${readyPosts} social post${readyPosts !== 1 ? "s" : ""} approved and ready to publish</div></div>` : ""}
      ` : "";

      const html = emailWrapper(`
        <div class="card">
          <div class="heading">Good morning, ${firstName} 👋</div>
          <div class="sub">${dateStr} · Your AI workforce briefing</div>
          ${statsHtml}
          ${alertsHtml}
          ${meetingsHtml}
          ${queueHtml}
          <a href="https://axiploy.vercel.app/portal/admin-assist" class="btn">Open Daily Briefing →</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#475569;margin-top:8px;">
          Your AI Admin Assistant prepared this briefing for ${clientName}.
        </p>
      `);

      await sendEmail({
        to: user.email,
        subject: `Good morning ${firstName} — your ${dateStr} briefing`,
        html,
      });

      // Log it
      await supabase.from("activity_log").insert({
        client_id: clientId,
        digital_employee: "AI Admin Assistant",
        action: "Morning briefing email sent",
        details: `${tasks.length} tasks · ${meetings.length} meetings · ${approvals} approvals`,
        status: "success",
      });

      sent++;
    } catch {
      // Don't let one client failure stop the others
    }
  }

  return NextResponse.json({ sent });
}
