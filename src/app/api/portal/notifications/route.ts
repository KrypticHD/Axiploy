import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ notifications: [] });
  let clientId: string;
  try { clientId = JSON.parse(raw).clientId; } catch { return NextResponse.json({ notifications: [] }); }

  const supabase = supabaseAdmin();
  const [approvalsRes, onboardingRes, activityRes] = await Promise.all([
    supabase.from("approvals").select("*").eq("client_id", clientId).eq("status", "pending"),
    supabase.from("onboarding").select("*").eq("client_id", clientId).in("risk_level", ["High", "Critical"]),
    supabase.from("activity_log").select("*").eq("client_id", clientId).eq("status", "error").order("created_at", { ascending: false }).limit(5),
  ]);

  const notifications: { id: string; type: string; title: string; body: string; createdAt: string }[] = [];

  (approvalsRes.data || []).forEach((a) => {
    notifications.push({
      id: `approval-${a.id}`,
      type: "approval",
      title: `Approval needed: ${a.type}`,
      body: a.employee_name ? `For ${a.employee_name}` : a.description || "",
      createdAt: a.created_at,
    });
  });

  (onboardingRes.data || []).forEach((o) => {
    notifications.push({
      id: `risk-${o.id}`,
      type: "risk",
      title: `High risk: ${o.employee_name}`,
      body: `${o.missing_documents} missing documents · starts ${new Date(o.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`,
      createdAt: o.created_at,
    });
  });

  (activityRes.data || []).forEach((a) => {
    notifications.push({
      id: `error-${a.id}`,
      type: "error",
      title: `Workflow failed: ${a.action}`,
      body: a.details || a.digital_employee,
      createdAt: a.created_at,
    });
  });

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ notifications });
}
