import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = supabaseAdmin();

  const projectsQuery = supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .neq("status", "cancelled");

  const { data: projects } = await projectsQuery;
  const projectIds = (projects || []).map((p) => p.id);

  if (projectIds.length === 0) {
    return NextResponse.json({ projects: [], tasks: [] });
  }

  let tasksQuery = supabase
    .from("project_tasks")
    .select("*")
    .in("project_id", projectIds);

  // Only fetch tasks that could plausibly overlap the visible window
  if (from) tasksQuery = tasksQuery.gte("end_date", from);
  if (to) tasksQuery = tasksQuery.lte("start_date", to);

  const { data: tasks } = await tasksQuery;
  const taskIds = (tasks || []).map((t) => t.id);

  const { data: assignments } = taskIds.length
    ? await supabase.from("task_assignments").select("*").in("task_id", taskIds)
    : { data: [] };

  const tasksWithAssignments = (tasks || []).map((t) => ({
    ...t,
    assignments: (assignments || []).filter((a) => a.task_id === t.id),
  }));

  return NextResponse.json({ projects: projects || [], tasks: tasksWithAssignments });
}
