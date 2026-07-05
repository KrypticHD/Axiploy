import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

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

  const [incidentsRes, actionsRes, clientRes, staffRes] = await Promise.all([
    supabase.from("safety_incidents").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("corrective_actions").select("*").eq("client_id", clientId).order("due_date", { ascending: true }),
    supabase.from("clients").select("report_token").eq("id", clientId).single(),
    supabase.from("onboarding").select("id, employee_name").eq("client_id", clientId).neq("status", "Cancelled").order("employee_name"),
  ]);

  const staffById = new Map((staffRes.data || []).map((s) => [s.id, s.employee_name]));
  const incidents = (incidentsRes.data || []).map((i) => ({ ...i, staffName: i.staff_id ? staffById.get(i.staff_id) || null : null }));
  const actions = actionsRes.data || [];

  const openIncidents = incidents.filter((i) => i.status === "new" || i.status === "investigating").length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueActions = actions.filter((a) => a.status === "open" && a.due_date && new Date(a.due_date) < today).length;

  let daysSinceLastIncident: number | null = null;
  if (incidents.length > 0) {
    const mostRecent = incidents.reduce((latest, i) =>
      new Date(i.created_at) > new Date(latest.created_at) ? i : latest
    );
    daysSinceLastIncident = Math.floor((today.getTime() - new Date(mostRecent.created_at).getTime()) / 86400000);
  }

  return NextResponse.json({
    incidents,
    actions,
    openIncidents,
    overdueActions,
    daysSinceLastIncident,
    reportToken: clientRes.data?.report_token || null,
    staffOptions: staffRes.data || [],
  });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from("safety_incidents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "AI Safety Assistant",
    action: `Incident updated${updates.status ? `: ${updates.status}` : ""}`,
    details: updates.status === "resolved" ? "Marked resolved" : "Details updated",
    status: "success",
  });

  return NextResponse.json({ ok: true });
}
