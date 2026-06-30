import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string; id: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "Policies";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });

  const fileType = ALLOWED_TYPES[file.type];
  if (!fileType) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

  const ext = file.name.split(".").pop() || fileType.toLowerCase();
  const uuid = crypto.randomUUID();
  const storagePath = `${session.clientId}/${uuid}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from("knowledge-base")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("knowledge-base").getPublicUrl(storagePath);

  const { data: doc, error: dbError } = await supabaseAdmin()
    .from("knowledge_documents")
    .insert({
      client_id: session.clientId,
      name: file.name.replace(`.${ext}`, ""),
      category,
      file_type: fileType,
      file_url: urlData.publicUrl,
      file_size_kb: Math.round(file.size / 1024),
      uploaded_by: session.id,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Extract text content for Ask Axiploy (PDFs and images only)
  if (process.env.ANTHROPIC_API_KEY && doc && ["PDF", "PNG", "JPG"].includes(fileType)) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const prompt = "Extract all readable text from this document. Return only the text content, no commentary.";

      let extractedContent: string | null = null;

      if (fileType === "PDF") {
        const res = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          messages: [{ role: "user", content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } } as never,
            { type: "text", text: prompt },
          ]}],
        });
        extractedContent = res.content[0].type === "text" ? res.content[0].text.trim() : null;
      } else {
        const imgType = file.type as "image/png" | "image/jpeg";
        const res = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: imgType, data: base64 } },
            { type: "text", text: prompt },
          ]}],
        });
        extractedContent = res.content[0].type === "text" ? res.content[0].text.trim() : null;
      }

      if (extractedContent) {
        await supabaseAdmin().from("knowledge_documents").update({ content: extractedContent }).eq("id", doc.id);
      }
    } catch {
      // Extraction failure is non-fatal — document still uploaded successfully
    }
  }

  // Log to activity
  await supabaseAdmin().from("activity_log").insert({
    client_id: session.clientId,
    digital_employee: "Knowledge Base",
    action: `Document uploaded: ${file.name}`,
    details: `Category: ${category}`,
    status: "success",
  });

  return NextResponse.json({ success: true, document: doc });
}
