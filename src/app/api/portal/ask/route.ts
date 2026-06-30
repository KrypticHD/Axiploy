import { NextRequest, NextResponse } from "next/server";
import { askEngine } from "@/lib/ask-engine";
import { supabaseAdmin } from "@/lib/supabase";

async function buildClientContext(clientId: string, clientName: string): Promise<string> {
  const supabase = supabaseAdmin();
  const [deRes, onboardingRes, approvalsRes, activityRes] = await Promise.all([
    supabase.from("digital_employees").select("name, status, tasks_completed, hours_saved, success_rate").eq("client_id", clientId),
    supabase.from("onboarding").select("employee_name, status, risk_level, missing_documents, start_date").eq("client_id", clientId).limit(20),
    supabase.from("approvals").select("action_type, related_person, digital_employee, created_at").eq("client_id", clientId).eq("status", "pending"),
    supabase.from("activity_log").select("digital_employee, action, details, status, created_at").eq("client_id", clientId).order("created_at", { ascending: false }).limit(10),
  ]);

  const des = deRes.data || [];
  const onboardings = onboardingRes.data || [];
  const approvals = approvalsRes.data || [];
  const activity = activityRes.data || [];

  const highRisk = onboardings.filter((e) => ["High", "Critical"].includes(e.risk_level || ""));
  const active = onboardings.filter((e) => !["Complete", "Cancelled"].includes(e.status || ""));

  return `
Client: ${clientName}
Date: ${new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

## AI Workforce
${des.length === 0 ? "No AI employees configured yet." : des.map((d) => `- ${d.name} (${d.status}): ${d.tasks_completed} tasks, ${d.hours_saved}h saved, ${d.success_rate}% success rate`).join("\n")}

## Onboarding
- Active onboardings: ${active.length}
- High/critical risk: ${highRisk.length}
${highRisk.map((e) => `  - ${e.employee_name}: ${e.risk_level} risk, ${e.missing_documents} docs missing, starting ${e.start_date}`).join("\n")}

## Pending Approvals (${approvals.length})
${approvals.length === 0 ? "None" : approvals.map((a) => `- ${a.digital_employee} wants to ${a.action_type} for ${a.related_person}`).join("\n")}

## Recent Activity (last 10)
${activity.length === 0 ? "No recent activity" : activity.map((a) => `- [${a.status}] ${a.digital_employee}: ${a.action}${a.details ? ` — ${a.details}` : ""}`).join("\n")}
`.trim();
}

// Simple in-memory rate limit: 20 Claude calls per user per day
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const DAILY_LIMIT = 20;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 86_400_000 });
    return true;
  }
  if (entry.count >= DAILY_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const raw = req.cookies.get("axiploy_session")?.value;
    let session: { clientId?: string; clientName?: string; id?: string } = {};
    try { if (raw) session = JSON.parse(raw); } catch {}

    if (process.env.ANTHROPIC_API_KEY && session.clientId) {
      if (session.id && !checkRateLimit(session.id)) {
        return NextResponse.json({
          response: {
            text: "You've reached the daily limit of 20 AI questions. Come back tomorrow, or contact Axiploy if you need more.",
            bullets: [], metrics: [], actions: [],
          },
        });
      }
      const context = await buildClientContext(session.clientId, session.clientName || "your company");

      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are Axiploy — an AI operations director embedded in a client's workforce management portal. You have direct access to their real-time data. Answer concisely and helpfully. Use bullet points when listing multiple items. Keep responses under 300 words unless the user asks for more detail.

Current client data:
${context}`,
        messages: [{ role: "user", content: message }],
      });

      const text = msg.content[0].type === "text" ? msg.content[0].text : "";
      return NextResponse.json({
        response: { text, bullets: [], metrics: [], actions: [] },
      });
    }

    // Fallback to keyword engine
    const response = askEngine(message);
    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
