import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin()
    .from("workflow_runs")
    .select("*")
    .eq("client_id", session.clientId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const runs = data || [];

  // Group by workflow_name
  const grouped: Record<string, typeof runs> = {};
  for (const run of runs) {
    if (!grouped[run.workflow_name]) grouped[run.workflow_name] = [];
    grouped[run.workflow_name].push(run);
  }

  const workflows = Object.entries(grouped).map(([name, wRuns]) => {
    const total = wRuns.length;
    const failed = wRuns.filter((r) => r.status === "failed").length;
    const success = total - failed;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
    const avgDuration = total > 0
      ? Math.round(wRuns.reduce((s, r) => s + (r.duration_ms || 0), 0) / total)
      : 0;
    const latest = wRuns[0];
    return {
      name,
      digital_employee: latest.digital_employee,
      status: latest.status === "failed" ? "Failed" : latest.status === "running" ? "Active" : "Active",
      last_run: latest.created_at,
      last_result: latest.result || "",
      total_runs: total,
      failed_runs: failed,
      success_rate: successRate,
      avg_duration_ms: avgDuration,
    };
  });

  return NextResponse.json({ workflows });
}
