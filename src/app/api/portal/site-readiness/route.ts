import { NextRequest, NextResponse } from "next/server";
import { getStaffReadinessRows } from "@/lib/staff-readiness";

export const runtime = "nodejs";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).clientId || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const rows = await getStaffReadinessRows(clientId);
  const readyCount = rows.filter((r) => r.overall === "ready").length;

  return NextResponse.json({ rows, total: rows.length, ready: readyCount });
}
