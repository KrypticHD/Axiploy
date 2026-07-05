import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cascadeFromTask } from "@/lib/scheduler-dependencies";

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
  const { project_id, name, start_date, end_date, notes } = body;

  if (!project_id || !name || !start_date || !end_date) {
    return NextResponse.json({ error: "project_id, name, start_date and end_date are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("project_tasks")
    .insert({
      project_id,
      client_id: clientId,
      name,
      start_date,
      end_date,
      status: "not_started",
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "Scheduler",
    action: `Task added: ${name}`,
    details: `${new Date(start_date).toLocaleDateString("en-AU")} → ${new Date(end_date).toLocaleDateString("en-AU")}`,
    status: "success",
  });

  return NextResponse.json({ task: { ...data, assignments: [] } });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("project_tasks")
    .update(updates)
    .eq("id", id)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let shifted: Awaited<ReturnType<typeof cascadeFromTask>> = [];
  if (updates.start_date || updates.end_date) {
    shifted = await cascadeFromTask(clientId, id);
    if (shifted.length) {
      await supabaseAdmin().from("activity_log").insert({
        client_id: clientId,
        digital_employee: "Scheduler",
        action: `Dependent tasks shifted: ${shifted.map((s) => s.name).join(", ")}`,
        details: `Triggered by moving "${data.name}"`,
        status: "success",
      });
    }
  }

  return NextResponse.json({ task: data, shifted });
}

export async function DELETE(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin()
    .from("project_tasks")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
