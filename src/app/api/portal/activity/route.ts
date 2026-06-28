import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("axiploy_session")?.value;
  if (!session) return NextResponse.json({ activity: [] });

  let clientId: string;
  try { clientId = JSON.parse(session).clientId; } catch { return NextResponse.json({ activity: [] }); }

  const { data } = await supabaseAdmin()
    .from("activity_log")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(100);

  const activity = (data || []).map((a) => ({
    id: a.id,
    clientId: a.client_id,
    digitalEmployee: a.digital_employee,
    action: a.action,
    result: a.details || "",
    status: a.status,
    timestamp: a.created_at,
  }));

  return NextResponse.json({ activity });
}
