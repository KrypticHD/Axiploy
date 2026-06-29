import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: onboarding, error } = await supabaseAdmin()
    .from("onboarding")
    .select("*, clients(name, logo_url)")
    .eq("token", token)
    .single();

  if (error || !onboarding) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (onboarding.status === "Cancelled") {
    return NextResponse.json({ error: "This onboarding link has been cancelled" }, { status: 410 });
  }

  const { data: documents } = await supabaseAdmin()
    .from("documents")
    .select("*")
    .eq("onboarding_id", onboarding.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    onboarding: {
      id: onboarding.id,
      employeeName: onboarding.employee_name,
      role: onboarding.role,
      department: onboarding.department,
      manager: onboarding.manager,
      startDate: onboarding.start_date,
      status: onboarding.status,
      progress: onboarding.progress,
      missingDocuments: onboarding.missing_documents,
      documentsRequired: onboarding.documents_required,
    },
    client: {
      name: onboarding.clients?.name || "Your Company",
      logoUrl: onboarding.clients?.logo_url || null,
    },
    documents: (documents || []).map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      required: d.required,
      received: d.received,
      receivedAt: d.received_at,
      fileUrl: d.file_url,
    })),
  });
}
