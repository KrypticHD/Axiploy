import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { wouldCreateCycle, cascadeFromTask } from "@/lib/scheduler-dependencies";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).clientId || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { project_id, predecessor_task_id, successor_task_id, link_type, lag_days } = body;

  if (!project_id || !predecessor_task_id || !successor_task_id) {
    return NextResponse.json({ error: "project_id, predecessor_task_id and successor_task_id are required" }, { status: 400 });
  }
  if (predecessor_task_id === successor_task_id) {
    return NextResponse.json({ error: "A task cannot depend on itself" }, { status: 400 });
  }

  // Both tasks must belong to this project (dependencies are scoped to a single project)
  const { data: tasks } = await supabaseAdmin()
    .from("project_tasks")
    .select("id")
    .eq("client_id", clientId)
    .eq("project_id", project_id)
    .in("id", [predecessor_task_id, successor_task_id]);

  if ((tasks || []).length !== 2) {
    return NextResponse.json({ error: "Both tasks must belong to the same project" }, { status: 400 });
  }

  const cyclic = await wouldCreateCycle(clientId, predecessor_task_id, successor_task_id);
  if (cyclic) {
    return NextResponse.json({ error: "This dependency would create a circular chain — not allowed." }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin()
    .from("task_dependencies")
    .insert({
      client_id: clientId,
      project_id,
      predecessor_task_id,
      successor_task_id,
      link_type: link_type || "FS",
      lag_days: lag_days ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Snap the successor (and anything downstream of it) into a valid position immediately
  const shifted = await cascadeFromTask(clientId, predecessor_task_id);

  return NextResponse.json({ dependency: data, shifted });
}

export async function DELETE(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin()
    .from("task_dependencies")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
