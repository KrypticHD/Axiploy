import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId as string || null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ assets: [] });

  const { data } = await supabaseAdmin()
    .from("social_assets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ assets: data || [] });
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
