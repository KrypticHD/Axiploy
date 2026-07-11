import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getSession(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

const VALID_MODES = ["warning_only", "manager_override", "hard_block"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (session?.role !== "axiploy_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const { data } = await supabaseAdmin()
    .from("clients")
    .select("enabled_modules, scheduling_enforcement_mode")
    .eq("id", clientId)
    .single();

  return NextResponse.json({
    enabledModules: data?.enabled_modules ?? null,
    schedulingEnforcementMode: data?.scheduling_enforcement_mode || "manager_override",
  });
}

/**
 * Axiploy-staff-only control for what a tenant's own portal navigation
 * shows. Distinct from AgentManager (which assigns/configures digital
 * employees) — this governs `clients.enabled_modules`, the array
 * PortalSidebar.tsx checks per nav item.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (session?.role !== "axiploy_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const { enabledModules, schedulingEnforcementMode } = await req.json();

  if (schedulingEnforcementMode && !VALID_MODES.includes(schedulingEnforcementMode)) {
    return NextResponse.json({ error: "Invalid scheduling enforcement mode" }, { status: 400 });
  }

  const { data: before } = await supabaseAdmin()
    .from("clients")
    .select("enabled_modules, scheduling_enforcement_mode, name")
    .eq("id", clientId)
    .single();

  const updates: Record<string, unknown> = {};
  if (enabledModules !== undefined) updates.enabled_modules = enabledModules;
  if (schedulingEnforcementMode !== undefined) updates.scheduling_enforcement_mode = schedulingEnforcementMode;

  const { error } = await supabaseAdmin().from("clients").update(updates).eq("id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: clientId,
    digital_employee: "Axiploy Admin",
    action: `Module access changed for ${before?.name || "client"}`,
    details: `By ${session.name || session.email || "Axiploy admin"} · modules: ${JSON.stringify(before?.enabled_modules)} → ${JSON.stringify(enabledModules ?? before?.enabled_modules)}${schedulingEnforcementMode ? ` · scheduling mode: ${before?.scheduling_enforcement_mode} → ${schedulingEnforcementMode}` : ""}`,
    status: "success",
  });

  return NextResponse.json({ success: true });
}
