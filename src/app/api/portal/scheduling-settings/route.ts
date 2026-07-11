import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId || null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data } = await supabaseAdmin().from("clients").select("scheduling_enforcement_mode").eq("id", clientId).single();
  return NextResponse.json({ mode: data?.scheduling_enforcement_mode || "manager_override" });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { mode } = await req.json();
  if (!["warning_only", "manager_override", "hard_block"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("clients").update({ scheduling_enforcement_mode: mode }).eq("id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "Scheduler",
    action: `Scheduling enforcement mode changed: ${mode}`,
    details: "",
    status: "success",
  });

  return NextResponse.json({ success: true });
}
