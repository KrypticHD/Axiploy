import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WEBP",
};

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string; id: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  if (!session.clientId) return NextResponse.json({ error: "No client context" }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string | null) || null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  const fileType = ALLOWED_TYPES[file.type];
  if (!fileType) return NextResponse.json({ error: "Only PNG, JPG, and WEBP images are allowed" }, { status: 400 });

  const ext = file.name.split(".").pop() || fileType.toLowerCase();
  const uuid = crypto.randomUUID();
  const storagePath = `${session.clientId}/${uuid}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from("social-media-assets")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("social-media-assets").getPublicUrl(storagePath);

  const { data: asset, error: dbError } = await supabaseAdmin()
    .from("social_assets")
    .insert({
      client_id: session.clientId,
      name: file.name.replace(`.${ext}`, ""),
      file_url: urlData.publicUrl,
      file_size_kb: Math.round(file.size / 1024),
      uploaded_by: session.id,
      folder: folder || null,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: session.clientId,
    digital_employee: "AI Social Media Manager",
    action: `Photo uploaded: ${file.name}`,
    details: `${Math.round(file.size / 1024)}KB ${fileType}`,
    status: "success",
  });

  return NextResponse.json({ success: true, asset });
}
