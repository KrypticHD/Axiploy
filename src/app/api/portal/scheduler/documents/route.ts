import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

const MAX_BYTES = 25 * 1024 * 1024;

function getSession(req: NextRequest): { clientId: string; id: string } | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("project_id") as string | null;

  if (!file || !projectId) return NextResponse.json({ error: "File and project_id required" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });

  const fileType = ALLOWED_TYPES[file.type];
  if (!fileType) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

  const { data: project } = await supabaseAdmin()
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("client_id", session.clientId)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const ext = file.name.split(".").pop() || fileType.toLowerCase();
  const uuid = crypto.randomUUID();
  const storagePath = `${session.clientId}/${projectId}/${uuid}.${ext}`;

  const buffer = new Uint8Array(await file.arrayBuffer());

  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from("project-documents")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("project-documents").getPublicUrl(storagePath);

  const { data: doc, error: dbError } = await supabaseAdmin()
    .from("project_documents")
    .insert({
      project_id: projectId,
      client_id: session.clientId,
      name: file.name.replace(`.${ext}`, ""),
      file_url: urlData.publicUrl,
      file_type: fileType,
      file_size_kb: Math.round(file.size / 1024),
      uploaded_by: session.id,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: session.clientId,
    digital_employee: "Scheduler",
    action: `Document uploaded: ${file.name}`,
    details: `Project document`,
    status: "success",
  });

  return NextResponse.json({ success: true, document: doc });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin()
    .from("project_documents")
    .delete()
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
