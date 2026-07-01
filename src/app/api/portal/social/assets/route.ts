import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId as string || null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ assets: [], folders: [] });

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder"); // null = all, "" = uncategorized, "name" = specific folder

  let query = supabaseAdmin()
    .from("social_assets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (folder === "") {
    query = query.or("folder.is.null,folder.eq.");
  } else if (folder !== null) {
    query = query.eq("folder", folder);
  }

  const { data } = await query;

  // Get distinct folder names for sidebar
  const { data: folderRows } = await supabaseAdmin()
    .from("social_assets")
    .select("folder")
    .eq("client_id", clientId)
    .not("folder", "is", null)
    .neq("folder", "");

  const folders = [...new Set((folderRows || []).map((r) => r.folder as string))].sort();

  return NextResponse.json({ assets: data || [], folders });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, folder } = await req.json();
  const { error } = await supabaseAdmin()
    .from("social_assets")
    .update({ folder: folder || null })
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, fileUrl } = await req.json();

  // Remove from storage
  if (fileUrl) {
    const supabase = supabaseAdmin();
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/storage/v1/object/public/social-media-assets/");
    if (pathParts[1]) {
      await supabase.storage.from("social-media-assets").remove([pathParts[1]]);
    }
  }

  const { error } = await supabaseAdmin()
    .from("social_assets")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
