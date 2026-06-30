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
    .from("knowledge_documents")
    .select("*")
    .eq("client_id", session.clientId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data || [] });
}

export async function PATCH(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { id, name, category } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, string> = {};
  if (name) updates.name = name.trim();
  if (category) updates.category = category;

  const { error } = await supabaseAdmin()
    .from("knowledge_documents")
    .update(updates)
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = supabaseAdmin();

  // Get file_url to remove from storage
  const { data: doc } = await supabase
    .from("knowledge_documents")
    .select("file_url")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .single();

  if (doc?.file_url) {
    // Extract storage path from URL
    const url = new URL(doc.file_url);
    const pathParts = url.pathname.split("/knowledge-base/");
    if (pathParts[1]) {
      await supabase.storage.from("knowledge-base").remove([decodeURIComponent(pathParts[1])]);
    }
  }

  const { error } = await supabase
    .from("knowledge_documents")
    .delete()
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
