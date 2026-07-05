export interface DocumentValidationResult {
  documentTypeMatches: boolean;
  detectedName: string | null;
  nameMatches: boolean;
  expiryDate: string | null;
  isExpired: boolean;
  isLegible: boolean;
  confidence: number;
  issues: string[];
}

const FALLBACK: DocumentValidationResult = {
  documentTypeMatches: true,
  detectedName: null,
  nameMatches: true,
  expiryDate: null,
  isExpired: false,
  isLegible: true,
  confidence: 1,
  issues: [],
};

/**
 * Uses Claude vision to check an uploaded ticket/document against what was expected.
 * Non-fatal: any failure (no API key, bad response, network error) falls back to
 * auto-approving, matching pre-validation behaviour rather than blocking uploads.
 */
export async function validateDocument(
  buffer: ArrayBuffer,
  mimeType: string,
  expectedDocumentName: string,
  expectedHolderName: string
): Promise<DocumentValidationResult> {
  if (!process.env.ANTHROPIC_API_KEY) return FALLBACK;

  const supportedImage = mimeType === "image/png" || mimeType === "image/jpeg" || mimeType === "image/jpg";
  const supportedPdf = mimeType === "application/pdf";
  if (!supportedImage && !supportedPdf) return FALLBACK;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const base64 = Buffer.from(buffer).toString("base64");
    const today = new Date().toISOString().split("T")[0];

    const prompt = `You are checking a document uploaded for a worker's site compliance record.
Expected document type: "${expectedDocumentName}"
Expected holder name: "${expectedHolderName}"
Today's date: ${today}

Look at the uploaded file and determine:
1. Does it actually appear to be a "${expectedDocumentName}" (or a reasonable equivalent — e.g. "White Card" and "Construction Induction Card" are the same thing)?
2. Whose name is on the document, and does it reasonably match "${expectedHolderName}" (allow for minor spelling variation, nicknames, middle names)?
3. Is there an expiry date printed on it? If so, what is it (YYYY-MM-DD)? Is it already expired relative to today?
4. Is the document clearly legible (not blurry, cropped, or unreadable)?

Respond with ONLY valid JSON, no markdown fences, no commentary, in this exact shape:
{"documentTypeMatches": boolean, "detectedName": string|null, "nameMatches": boolean, "expiryDate": string|null, "isExpired": boolean, "isLegible": boolean, "confidence": number between 0 and 1, "issues": string[]}

"issues" should be a short list of plain-English reasons a human should double check this (empty array if everything looks correct).`;

    const content = supportedPdf
      ? [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } } as never,
          { type: "text", text: prompt },
        ]
      : [
          { type: "image", source: { type: "base64", media_type: mimeType as "image/png" | "image/jpeg", data: base64 } } as never,
          { type: "text", text: prompt },
        ];

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: content as never }],
    });

    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      documentTypeMatches: !!parsed.documentTypeMatches,
      detectedName: parsed.detectedName ?? null,
      nameMatches: !!parsed.nameMatches,
      expiryDate: parsed.expiryDate ?? null,
      isExpired: !!parsed.isExpired,
      isLegible: parsed.isLegible !== false,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 6) : [],
    };
  } catch {
    return FALLBACK;
  }
}

export function decideValidationStatus(
  result: DocumentValidationResult,
  autoApproveThreshold = 0.75
): { status: "auto_approved" | "needs_review"; notes: string | null } {
  const passes =
    result.documentTypeMatches &&
    result.nameMatches &&
    result.isLegible &&
    !result.isExpired &&
    result.confidence >= autoApproveThreshold;

  if (passes) return { status: "auto_approved", notes: null };

  const notes = result.issues.length > 0
    ? result.issues.join(" · ")
    : "This document needs a quick manual check before it's approved.";

  return { status: "needs_review", notes };
}
