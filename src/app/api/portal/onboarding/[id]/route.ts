import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (!session?.clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  // Delete documents first (FK constraint)
  await supabaseAdmin().from("documents").delete().eq("onboarding_id", id);

  // Delete the onboarding record (scoped to client for safety)
  const { error } = await supabaseAdmin()
    .from("onboarding")
    .delete()
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
