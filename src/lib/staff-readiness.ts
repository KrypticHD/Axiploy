import { supabaseAdmin } from "@/lib/supabase";

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

function computeTicketCell(d: {
  id: string; name: string; received: boolean;
  validation_status: string | null; expiry_date: string | null; file_url: string | null;
}, today: Date): TicketCell {
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

  return { documentId: d.id, name: d.name, status, expiryDate: d.expiry_date, fileUrl: d.file_url };
}

function computeOverall(tickets: TicketCell[]): WorkerRow["overall"] {
  const hasBlocking = tickets.some((t) => t.status === "missing" || t.status === "expired" || t.status === "needs_review");
  const hasWarning = tickets.some((t) => t.status === "expiring");
  return hasBlocking ? "not_ready" : hasWarning ? "action_required" : "ready";
}

/** Every worker's ticket matrix for a client — powers the Site Readiness roster. */
export async function getStaffReadinessRows(clientId: string): Promise<WorkerRow[]> {
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

  return onboarding.map((o) => {
    const docs = documents.filter((d) => d.onboarding_id === o.id);
    const tickets = docs.map((d) => computeTicketCell(d, today));
    return {
      onboardingId: o.id,
      employeeName: o.employee_name,
      role: o.role || "",
      status: o.status,
      overall: computeOverall(tickets),
      tickets,
    };
  });
}

/** A single worker's ticket matrix — powers the Staff Directory detail view. */
export async function getStaffReadinessForOne(clientId: string, onboardingId: string): Promise<WorkerRow | null> {
  const supabase = supabaseAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [onboardingRes, documentsRes] = await Promise.all([
    supabase.from("onboarding").select("id, employee_name, role, status")
      .eq("client_id", clientId).eq("id", onboardingId).single(),
    supabase.from("documents").select("*").eq("client_id", clientId).eq("onboarding_id", onboardingId).eq("required", true),
  ]);

  if (!onboardingRes.data) return null;

  const tickets = (documentsRes.data || []).map((d) => computeTicketCell(d, today));
  return {
    onboardingId: onboardingRes.data.id,
    employeeName: onboardingRes.data.employee_name,
    role: onboardingRes.data.role || "",
    status: onboardingRes.data.status,
    overall: computeOverall(tickets),
    tickets,
  };
}
