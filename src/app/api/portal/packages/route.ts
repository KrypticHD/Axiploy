import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ onboarding: false, admin: false, growth: false });

  let session: { clientId?: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ onboarding: false, admin: false, growth: false });
  }

  if (!session.clientId) {
    return NextResponse.json({ onboarding: false, admin: false, growth: false });
  }

  const { data } = await supabaseAdmin()
    .from("digital_employees")
    .select("type")
    .eq("client_id", session.clientId);

  const types = (data || []).map((r: { type: string }) => r.type);
  return NextResponse.json({
    onboarding: types.includes("onboarding"),
    admin: types.includes("admin"),
    growth: types.includes("growth"),
  });
}
