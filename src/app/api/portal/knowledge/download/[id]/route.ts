import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: doc } = await supabase
    .from("knowledge_documents")
    .select("file_url, name, file_type")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .single();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Extract storage path from public URL
  const url = new URL(doc.file_url);
  const pathParts = url.pathname.split("/knowledge-base/");
  if (!pathParts[1]) return NextResponse.json({ error: "Invalid file path" }, { status: 500 });

  const storagePath = decodeURIComponent(pathParts[1]);
  const { data: signedUrl, error } = await supabase.storage
    .from("knowledge-base")
    .createSignedUrl(storagePath, 60, { download: `${doc.name}.${doc.file_type.toLowerCase()}` });

  if (error || !signedUrl) return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });

  return NextResponse.redirect(signedUrl.signedUrl);
}
