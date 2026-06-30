import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  let session: { role?: string };
  try { session = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid session" }, { status: 401 }); }
  if (session.role !== "axiploy_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const type = req.nextUrl.searchParams.get("type") || "onboarding";

  const { data } = await supabaseAdmin()
    .from("digital_employees")
    .select("config")
    .eq("client_id", clientId)
    .eq("type", type)
    .single();

  return NextResponse.json({ config: data?.config || null });
}
