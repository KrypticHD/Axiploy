import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string; clientName: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { clientId, clientName } = session;
  const supabase = supabaseAdmin();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [deRes, onboardingRes, activityRes, approvalsRes] = await Promise.all([
    supabase.from("digital_employees").select("hours_saved, tasks_completed").eq("client_id", clientId),
    supabase.from("onboarding").select("id, status").eq("client_id", clientId),
    supabase.from("activity_log").select("id").eq("client_id", clientId).gte("created_at", monthStart.toISOString()),
    supabase.from("approvals").select("id, status").eq("client_id", clientId).neq("status", "pending"),
  ]);

  const hoursSaved = (deRes.data || []).reduce((sum, d) => sum + (d.hours_saved || 0), 0);
  const tasksCompleted = (deRes.data || []).reduce((sum, d) => sum + (d.tasks_completed || 0), 0);
  const activeOnboardings = (onboardingRes.data || []).filter((r) => !["Complete", "Cancelled"].includes(r.status)).length;
  const completedOnboardings = (onboardingRes.data || []).filter((r) => r.status === "Complete").length;
  const actionsThisMonth = activityRes.data?.length ?? 0;
  const approvalsHandled = approvalsRes.data?.length ?? 0;

  return NextResponse.json({
    hoursSaved,
    tasksCompleted,
    activeOnboardings,
    completedOnboardings,
    actionsThisMonth,
    approvalsHandled,
    clientName,
  });
}
