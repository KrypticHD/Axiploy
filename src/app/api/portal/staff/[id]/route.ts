import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStaffReadinessForOne } from "@/lib/staff-readiness";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).clientId || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  const [readiness, staffRes, complianceRes, incidentsRes] = await Promise.all([
    getStaffReadinessForOne(clientId, id),
    supabaseAdmin().from("onboarding").select("*").eq("client_id", clientId).eq("id", id).single(),
    supabaseAdmin().from("compliance_items").select("*").eq("client_id", clientId).eq("staff_id", id),
    supabaseAdmin().from("safety_incidents").select("*").eq("client_id", clientId).eq("staff_id", id).order("created_at", { ascending: false }),
  ]);

  if (!staffRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    staff: staffRes.data,
    readiness,
    complianceItems: complianceRes.data || [],
    incidents: incidentsRes.data || [],
  });
}
