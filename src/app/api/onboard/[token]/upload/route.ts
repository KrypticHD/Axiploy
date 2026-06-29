import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Validate token
  const { data: onboarding, error } = await supabaseAdmin()
    .from("onboarding")
    .select("id, client_id, employee_name, documents_required")
    .eq("token", token)
    .single();

  if (error || !onboarding) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  // Parse form data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const documentId = formData.get("documentId") as string | null;
  const documentName = formData.get("documentName") as string | null;

  if (!file || !documentId) {
    return NextResponse.json({ error: "Missing file or documentId" }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Please upload a PDF or image." }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "pdf";
  const storagePath = `${token}/${documentId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin()
    .storage
    .from("onboarding-documents")
    .upload(storagePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin()
    .storage
    .from("onboarding-documents")
    .getPublicUrl(storagePath);

  // Update document record
  await supabaseAdmin()
    .from("documents")
    .update({ received: true, file_url: publicUrl, received_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("onboarding_id", onboarding.id);

  // Recalculate progress
  const { data: allDocs } = await supabaseAdmin()
    .from("documents")
    .select("required, received")
    .eq("onboarding_id", onboarding.id);

  const required = (allDocs || []).filter((d) => d.required);
  const received = required.filter((d) => d.received);
  const missingDocuments = required.length - received.length;
  const progress = required.length > 0 ? Math.round((received.length / required.length) * 100) : 0;
  const allComplete = missingDocuments === 0;

  await supabaseAdmin()
    .from("onboarding")
    .update({
      missing_documents: missingDocuments,
      progress,
      status: allComplete ? "Ready for Review" : "In Progress",
    })
    .eq("id", onboarding.id);

  // Log activity
  await supabaseAdmin().from("activity_log").insert({
    client_id: onboarding.client_id,
    digital_employee: "AI Onboarding Assistant",
    action: `Document received: ${documentName || "Document"}`,
    details: `Uploaded by ${onboarding.employee_name} · ${received.length}/${required.length} documents complete`,
    status: "success",
  });

  // If all complete — create approval request + log completion
  if (allComplete) {
    await supabaseAdmin().from("approvals").insert({
      client_id: onboarding.client_id,
      type: "Review Onboarding",
      employee_name: onboarding.employee_name,
      requested_by: "AI Onboarding Assistant",
      description: `All documents received for ${onboarding.employee_name}. Please review and approve their onboarding.`,
      status: "pending",
    });

    await supabaseAdmin().from("activity_log").insert({
      client_id: onboarding.client_id,
      digital_employee: "AI Onboarding Assistant",
      action: `Onboarding complete: ${onboarding.employee_name}`,
      details: "All required documents received. Awaiting manager review.",
      status: "success",
    });
  }

  return NextResponse.json({ success: true, fileUrl: publicUrl, progress, missingDocuments, allComplete });
}
