import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

  const [tasksRes, meetingsRes, activityRes, approvalsRes, onboardingRes] = await Promise.all([
    supabaseAdmin().from("admin_tasks").select("*").eq("client_id", session.clientId).neq("status", "completed").order("due_date", { ascending: true }),
    supabaseAdmin().from("admin_meetings").select("*").eq("client_id", session.clientId).gte("start_time", todayStart).lt("start_time", todayEnd).order("start_time", { ascending: true }),
    supabaseAdmin().from("activity_log").select("digital_employee, action, status, created_at").eq("client_id", session.clientId).order("created_at", { ascending: false }).limit(5),
    supabaseAdmin().from("approvals").select("type, related_person, digital_employee").eq("client_id", session.clientId).eq("status", "pending"),
    supabaseAdmin().from("onboarding").select("employee_name, status, risk_level, start_date").eq("client_id", session.clientId).not("status", "in", '("Complete","Cancelled")').limit(5),
  ]);

  const tasks = tasksRes.data || [];
  const meetings = meetingsRes.data || [];
  const activity = activityRes.data || [];
  const approvals = approvalsRes.data || [];
  const onboarding = onboardingRes.data || [];

  const urgentTasks = tasks.filter((t: { priority: string }) => t.priority === "urgent" || t.priority === "high");
  const overdueTasks = tasks.filter((t: { due_date: string }) => t.due_date && new Date(t.due_date) < today);

  if (!process.env.ANTHROPIC_API_KEY) {
    // Return structured data without AI summary
    return NextResponse.json({
      date: today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      summary: null,
      meetings,
      tasks: { total: tasks.length, urgent: urgentTasks.length, overdue: overdueTasks.length, items: tasks.slice(0, 5) },
      approvals: approvals.length,
      activity,
      onboarding: onboarding.length,
    });
  }

  const context = `
Client: ${clientName}
Date: ${today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

TASKS (${tasks.length} pending):
${urgentTasks.length > 0 ? `Urgent/High: ${urgentTasks.map((t: { title: string; due_date: string }) => `${t.title}${t.due_date ? ` (due ${t.due_date})` : ""}`).join(", ")}` : "No urgent tasks"}
${overdueTasks.length > 0 ? `Overdue: ${overdueTasks.map((t: { title: string }) => t.title).join(", ")}` : ""}

TODAY'S MEETINGS (${meetings.length}):
${meetings.length === 0 ? "No meetings today" : meetings.map((m: { title: string; start_time: string }) => `${m.title} at ${new Date(m.start_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`).join(", ")}

PENDING APPROVALS: ${approvals.length}
ACTIVE ONBOARDING: ${onboarding.length}
RECENT ACTIVITY: ${activity.length > 0 ? activity.map((a: { digital_employee: string; action: string }) => `${a.digital_employee}: ${a.action}`).join("; ") : "None"}
`.trim();

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: `You are an executive assistant AI for ${clientName}. Write a concise, friendly daily briefing. Use plain text only — no markdown, no asterisks, no hashes. 2-3 sentences maximum. Focus on what needs attention today.`,
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
  });
}
