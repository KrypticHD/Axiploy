import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export interface TicketCell {
  documentId: string;
  name: string;
  status: "ready" | "needs_review" | "missing" | "expiring" | "expired";
  expiryDate: string | null;
  fileUrl: string | null;
}

export interface WorkerRow {
  onboardingId: string;
  employeeName: string;
  role: string;
  status: string;
  overall: "ready" | "action_required" | "not_ready";
  tickets: TicketCell[];
}

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

  const supabase = supabaseAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [onboardingRes, documentsRes] = await Promise.all([
    supabase.from("onboarding").select("id, employee_name, role, status")
      .eq("client_id", clientId).neq("status", "Cancelled").order("employee_name"),
    supabase.from("documents").select("*").eq("client_id", clientId).eq("required", true),
  ]);

  const onboarding = onboardingRes.data || [];
  const documents = documentsRes.data || [];

  const rows: WorkerRow[] = onboarding.map((o) => {
    const docs = documents.filter((d) => d.onboarding_id === o.id);

    const tickets: TicketCell[] = docs.map((d) => {
      let status: TicketCell["status"] = "missing";
      if (!d.received) {
        status = "missing";
      } else if (d.validation_status === "needs_review") {
        status = "needs_review";
      } else if (d.expiry_date) {
        const daysLeft = Math.floor((new Date(d.expiry_date).getTime() - today.getTime()) / 86400000);
        if (daysLeft < 0) status = "expired";
        else if (daysLeft <= 14) status = "expiring";
        else status = "ready";
      } else {
        status = "ready";
      }

      return {
        documentId: d.id,
        name: d.name,
        status,
        expiryDate: d.expiry_date,
        fileUrl: d.file_url,
      };
    });

    const hasBlocking = tickets.some((t) => t.status === "missing" || t.status === "expired" || t.status === "needs_review");
    const hasWarning = tickets.some((t) => t.status === "expiring");
    const overall: WorkerRow["overall"] = hasBlocking ? "not_ready" : hasWarning ? "action_required" : "ready";

    return {
      onboardingId: o.id,
      employeeName: o.employee_name,
      role: o.role || "",
      status: o.status,
      overall,
      tickets,
    };
  });

  const readyCount = rows.filter((r) => r.overall === "ready").length;

  return NextResponse.json({ rows, total: rows.length, ready: readyCount });
}
