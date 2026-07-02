import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, emailWrapper } from "@/lib/email";

export const runtime = "nodejs";

type Priority = "urgent" | "action" | "review" | "info";

export interface WorkItem {
  id: string;
  source: "approval" | "email_draft" | "social_post" | "missing_docs" | "risk" | "compliance" | "workflow_failure";
  agentType: "onboarding" | "admin" | "social" | "compliance" | "growth";
  title: string;
  subtitle: string;
  priority: Priority;
  createdAt: string;
  payload: Record<string, unknown>;
}

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, action: 1, review: 2, info: 3 };

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).clientId || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const supabase = supabaseAdmin();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [approvals, emailDrafts, socialPosts, onboarding, compliance, workflowFails] = await Promise.all([
    supabase.from("approvals").select("*").eq("client_id", clientId).eq("status", "pending"),
    supabase.from("admin_email_drafts").select("*").eq("client_id", clientId).eq("status", "draft"),
    supabase.from("social_posts").select("*").eq("client_id", clientId).eq("status", "draft"),
    supabase.from("onboarding").select("*").eq("client_id", clientId)
      .not("status", "in", '("Complete","Cancelled")'),
    supabase.from("compliance_items").select("*").eq("client_id", clientId),
    supabase.from("workflow_runs").select("*").eq("client_id", clientId)
      .eq("status", "failed").gte("created_at", weekAgo),
  ]);

  const items: WorkItem[] = [];

  for (const a of approvals.data || []) {
    items.push({
      id: `approval:${a.id}`,
      source: "approval",
      agentType: "onboarding",
      title: a.action_type || a.type || "Approval requested",
      subtitle: `${a.digital_employee || "AI Employee"} needs your decision${a.related_person || a.employee_name ? ` — ${a.related_person || a.employee_name}` : ""}`,
      priority: "action",
      createdAt: a.created_at,
      payload: a,
    });
  }

  for (const d of emailDrafts.data || []) {
    items.push({
      id: `email_draft:${d.id}`,
      source: "email_draft",
      agentType: "admin",
      title: d.subject || "Email draft",
      subtitle: "AI Admin drafted this email for your review",
      priority: "review",
      createdAt: d.created_at,
      payload: d,
    });
  }

  for (const p of socialPosts.data || []) {
    items.push({
      id: `social_post:${p.id}`,
      source: "social_post",
      agentType: "social",
      title: `${(p.platform || "social").charAt(0).toUpperCase()}${(p.platform || "social").slice(1)} post drafted`,
      subtitle: `AI Social wrote this post — approve to schedule`,
      priority: "review",
      createdAt: p.created_at,
      payload: p,
    });
  }

  for (const o of onboarding.data || []) {
    const highRisk = o.risk_level === "High" || o.risk_level === "Critical";
    if (highRisk) {
      items.push({
        id: `risk:${o.id}`,
        source: "risk",
        agentType: "onboarding",
        title: `${o.employee_name} is ${o.risk_level.toLowerCase()} risk`,
        subtitle: `AI Onboarding flagged this hire — starts ${o.start_date ? new Date(o.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "soon"}`,
        priority: "urgent",
        createdAt: o.created_at,
        payload: o,
      });
    } else if ((o.missing_documents || 0) > 0) {
      items.push({
        id: `missing_docs:${o.id}`,
        source: "missing_docs",
        agentType: "onboarding",
        title: `${o.employee_name} — ${o.missing_documents} document${o.missing_documents !== 1 ? "s" : ""} outstanding`,
        subtitle: "AI Onboarding is chasing these — send a manual nudge if needed",
        priority: "action",
        createdAt: o.created_at,
        payload: o,
      });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const c of compliance.data || []) {
    if (!c.expiry_date) continue;
    const daysLeft = Math.floor((new Date(c.expiry_date).getTime() - today.getTime()) / 86400000);
    if (daysLeft > 30) continue;
    const expired = daysLeft < 0;
    items.push({
      id: `compliance:${c.id}`,
      source: "compliance",
      agentType: "compliance",
      title: expired
        ? `${c.title} has expired`
        : `${c.title} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      subtitle: `AI Compliance is tracking this ${(c.category || "item").toLowerCase()} — renew to stay compliant`,
      priority: daysLeft <= 7 ? "urgent" : "action",
      createdAt: c.created_at,
      payload: { ...c, daysLeft },
    });
  }

  for (const w of workflowFails.data || []) {
    items.push({
      id: `workflow_failure:${w.id}`,
      source: "workflow_failure",
      agentType: "growth",
      title: `Workflow failed: ${w.workflow_name}`,
      subtitle: `${w.digital_employee || "An AI employee"} hit an error — Axiploy has been notified`,
      priority: "urgent",
      createdAt: w.created_at,
      payload: w,
    });
  }

  items.sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const urgent = items.filter((i) => i.priority === "urgent").length;

  if (req.nextUrl.searchParams.get("count")) {
    return NextResponse.json({ total: items.length, urgent });
  }

  return NextResponse.json({ items, total: items.length, urgent });
}

// POST — inbox-level actions that don't map to an existing API
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { action, onboardingId } = await req.json();
  const supabase = supabaseAdmin();

  if (action === "send_doc_reminder" && onboardingId) {
    const { data: ob } = await supabase
      .from("onboarding")
      .select("*")
      .eq("id", onboardingId)
      .eq("client_id", clientId)
      .single();

    if (!ob) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ob.email) return NextResponse.json({ error: "No email on record for this employee" }, { status: 400 });

    const { data: docs } = await supabase
      .from("documents")
      .select("name")
      .eq("onboarding_id", onboardingId)
      .eq("received", false);

    const missing = (docs || []).map((d: { name: string }) => d.name);
    const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://axiploy.vercel.app"}/onboard/${ob.token}`;

    const html = emailWrapper(`
      <div class="card">
        <div class="heading">📄 Quick reminder — documents outstanding</div>
        <div class="sub">Hi ${ob.employee_name.split(" ")[0]}, we're still missing a few documents for your onboarding.</div>
        ${missing.map((m) => `<div class="item"><div class="dot" style="background:#f59e0b"></div><div>${m}</div></div>`).join("")}
        <p style="margin-top:16px">Upload them in a couple of minutes using your secure link:</p>
        <a href="${portalLink}" class="btn">Upload documents →</a>
      </div>
    `);

    const result = await sendEmail({
      to: ob.email,
      subject: `Reminder: ${missing.length} document${missing.length !== 1 ? "s" : ""} outstanding for your onboarding`,
      html,
    });

    if (!result.ok) return NextResponse.json({ error: result.error || "Email failed" }, { status: 500 });

    await supabase.from("onboarding").update({ last_contacted: new Date().toISOString() }).eq("id", onboardingId);
    await supabase.from("activity_log").insert({
      client_id: clientId,
      digital_employee: "AI Onboarding Assistant",
      action: `Manual document reminder sent to ${ob.employee_name}`,
      details: `${missing.length} outstanding: ${missing.join(", ")}`,
      status: "success",
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
