import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function fetchOutlookEmails(clientId: string): Promise<{ urgent: number; unread: number; preview: string[] }> {
  try {
    const { data: connection } = await supabaseAdmin()
      .from("admin_outlook_connections")
      .select("access_token, refresh_token, expires_at")
      .eq("client_id", clientId)
      .maybeSingle();

    if (!connection) return { urgent: 0, unread: 0, preview: [] };

    // Refresh token if needed
    let token = connection.access_token;
    if (connection.refresh_token && new Date(connection.expires_at).getTime() < Date.now() + 60_000) {
      const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: connection.refresh_token,
          grant_type: "refresh_token",
        }),
      });
      const tokens = await res.json();
      if (res.ok && tokens.access_token) token = tokens.access_token;
    }

    const graphRes = await fetch(
      "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=10&$filter=isRead eq false&$select=subject,from,receivedDateTime",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!graphRes.ok) return { urgent: 0, unread: 0, preview: [] };

    const data = await graphRes.json();
    const emails: { subject: string; from: { emailAddress: { name: string } } }[] = data.value || [];
    const preview = emails.slice(0, 3).map((e) => `"${e.subject}" from ${e.from?.emailAddress?.name || "Unknown"}`);

    return { urgent: 0, unread: emails.length, preview };
  } catch {
    return { urgent: 0, unread: 0, preview: [] };
  }
}

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId?: string; clientName?: string; id?: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  if (!session.clientId) return NextResponse.json({ error: "No client context" }, { status: 400 });

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
  const clientName = session.clientName || "your company";

  const [tasksRes, meetingsRes, activityRes, approvalsRes, onboardingRes, emailsRes] = await Promise.all([
    supabaseAdmin().from("admin_tasks").select("*").eq("client_id", session.clientId).neq("status", "completed").order("due_date", { ascending: true }),
    supabaseAdmin().from("admin_meetings").select("*").eq("client_id", session.clientId).gte("start_time", todayStart).lt("start_time", todayEnd).order("start_time", { ascending: true }),
    supabaseAdmin().from("activity_log").select("digital_employee, action, status, created_at").eq("client_id", session.clientId).order("created_at", { ascending: false }).limit(5),
    supabaseAdmin().from("approvals").select("type, related_person, digital_employee").eq("client_id", session.clientId).eq("status", "pending"),
    supabaseAdmin().from("onboarding").select("employee_name, status, risk_level, start_date").eq("client_id", session.clientId).not("status", "in", '("Complete","Cancelled")').limit(5),
    fetchOutlookEmails(session.clientId),
  ]);

  const tasks = tasksRes.data || [];
  const meetings = meetingsRes.data || [];
  const activity = activityRes.data || [];
  const approvals = approvalsRes.data || [];
  const onboarding = onboardingRes.data || [];
  const emails = emailsRes;

  const urgentTasks = tasks.filter((t: { priority: string }) => t.priority === "urgent" || t.priority === "high");
  const overdueTasks = tasks.filter((t: { due_date: string }) => t.due_date && new Date(t.due_date) < today);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      date: today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      summary: null,
      meetings,
      tasks: { total: tasks.length, urgent: urgentTasks.length, overdue: overdueTasks.length, items: tasks.slice(0, 5) },
      approvals: approvals.length,
      activity,
      onboarding: onboarding.length,
      emails,
    });
  }

  const context = `
Client: ${clientName}
Date: ${today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

TASKS (${tasks.length} pending):
${urgentTasks.length > 0 ? `Urgent/High priority: ${urgentTasks.map((t: { title: string; due_date: string }) => `${t.title}${t.due_date ? ` (due ${t.due_date})` : ""}`).join(", ")}` : "No urgent tasks"}
${overdueTasks.length > 0 ? `Overdue: ${overdueTasks.map((t: { title: string }) => t.title).join(", ")}` : ""}

TODAY'S MEETINGS (${meetings.length}):
${meetings.length === 0 ? "No meetings today" : meetings.map((m: { title: string; start_time: string }) => `${m.title} at ${new Date(m.start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`).join(", ")}

EMAILS: ${emails.unread} unread in Outlook inbox
${emails.preview.length > 0 ? `Recent unread: ${emails.preview.join("; ")}` : ""}

PENDING APPROVALS: ${approvals.length}
ACTIVE ONBOARDING: ${onboarding.length} employees
${onboarding.filter((o: { risk_level: string }) => o.risk_level === "High" || o.risk_level === "Critical").length > 0 ? `At-risk employees: ${onboarding.filter((o: { risk_level: string }) => o.risk_level === "High" || o.risk_level === "Critical").map((o: { employee_name: string }) => o.employee_name).join(", ")}` : ""}
RECENT ACTIVITY: ${activity.length > 0 ? activity.map((a: { digital_employee: string; action: string }) => `${a.digital_employee}: ${a.action}`).join("; ") : "None"}
`.trim();

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: `You are an executive assistant AI for ${clientName}. Write a concise, friendly daily briefing covering tasks, meetings, emails and onboarding. Use plain text only — no markdown, no asterisks, no hashes. 2-3 sentences maximum. Focus on what needs attention today.`,
    messages: [{ role: "user", content: `Write today's briefing based on this data:\n${context}` }],
  });

  const summary = msg.content[0].type === "text" ? msg.content[0].text.trim() : null;

  return NextResponse.json({
    date: today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    summary,
    meetings,
    tasks: { total: tasks.length, urgent: urgentTasks.length, overdue: overdueTasks.length, items: tasks.slice(0, 5) },
    approvals: approvals.length,
    activity,
    onboarding: onboarding.length,
    emails,
  });
}
