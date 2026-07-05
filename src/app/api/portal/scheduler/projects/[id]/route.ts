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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const [projectRes, tasksRes, documentsRes] = await Promise.all([
    supabaseAdmin().from("projects").select("*").eq("id", id).eq("client_id", clientId).single(),
    supabaseAdmin().from("project_tasks").select("*").eq("project_id", id).eq("client_id", clientId).order("start_date"),
    supabaseAdmin().from("project_documents").select("*").eq("project_id", id).eq("client_id", clientId).order("created_at", { ascending: false }),
  ]);

  if (!projectRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const taskIds = (tasksRes.data || []).map((t) => t.id);
  const assignmentsRes = taskIds.length
    ? await supabaseAdmin().from("task_assignments").select("*").in("task_id", taskIds)
    : { data: [] };

  const tasks = (tasksRes.data || []).map((t) => ({
    ...t,
    assignments: (assignmentsRes.data || []).filter((a) => a.task_id === t.id),
  }));

  return NextResponse.json({
    project: projectRes.data,
    tasks,
    documents: documentsRes.data || [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const updates = await req.json();

  const { data, error } = await supabaseAdmin()
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const { error } = await supabaseAdmin()
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
