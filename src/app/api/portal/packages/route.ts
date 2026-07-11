import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const EMPTY = { onboarding: false, admin: false, growth: false, social: false, compliance: false, safety: false, agents: [], enabledModules: null };

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json(EMPTY);

  let session: { clientId?: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json(EMPTY);
  }

  if (!session.clientId) {
    return NextResponse.json(EMPTY);
  }

  const supabase = supabaseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [deRes, actRes, clientRes] = await Promise.all([
    supabase
      .from("digital_employees")
      .select("type, name, status")
      .eq("client_id", session.clientId),
    supabase
      .from("activity_log")
      .select("digital_employee")
      .eq("client_id", session.clientId)
      .gte("created_at", since)
      .limit(200),
    supabase
      .from("clients")
      .select("enabled_modules")
      .eq("id", session.clientId)
      .single(),
  ]);

  const rows = (deRes.data || []) as { type: string; name: string; status: string }[];
  const activeNames = new Set(
    ((actRes.data || []) as { digital_employee: string }[]).map((r) => r.digital_employee)
  );

  const types = rows.map((r) => r.type);
  const agents = rows.map((r) => ({
    type: r.type,
    name: r.name,
    status: r.status,
    working: activeNames.has(r.name),
  }));

  return NextResponse.json({
    onboarding: types.includes("onboarding"),
    admin: types.includes("admin"),
    growth: types.includes("growth"),
    social: types.includes("social"),
    compliance: types.includes("compliance"),
    safety: types.includes("safety"),
    agents,
    enabledModules: clientRes.data?.enabled_modules || null,
  });
}
