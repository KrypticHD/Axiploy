export type IncidentType = "injury" | "near_miss" | "property_damage" | "environmental" | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface IncidentClassification {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  notifiable: boolean;
  summary: string;
  suggestedActions: string[];
  confidence: number;
}

/**
 * Cautious fallback — unlike document validation, an incident report that can't
 * be classified must NOT quietly default to "low/nothing happens." Uncertainty
 * about a safety report should surface to a human, not disappear.
 */
function cautiousFallback(description: string): IncidentClassification {
  return {
    incidentType: "other",
    severity: "medium",
    notifiable: false,
    summary: description,
    suggestedActions: [],
    confidence: 0,
  };
}

/**
 * Uses Claude to classify a safety incident/near-miss report: type, severity,
 * whether it may need regulator notification, a formal drafted summary, and
 * suggested corrective actions. Non-fatal — any failure falls back to a
 * cautious (never auto-dismissed) default rather than blocking submission.
 */
export async function classifyIncident(
  description: string,
  location: string | null,
  photo?: { buffer: ArrayBuffer; mimeType: string } | null
): Promise<IncidentClassification> {
  if (!process.env.ANTHROPIC_API_KEY) return cautiousFallback(description);

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are the AI Safety Assistant for a mining/construction site. A worker has submitted a safety incident or near-miss report. Classify it carefully — err toward a HIGHER severity if you are unsure, never lower.

Description: "${description}"
${location ? `Location: ${location}` : ""}

Determine:
1. incidentType: one of "injury", "near_miss", "property_damage", "environmental", "other"
2. severity: one of "low", "medium", "high", "critical" — consider likelihood of harm and actual/potential consequence. Any mention of injury, hospitalisation, equipment failure involving people, falls, electrical, confined space, or mobile plant near-misses should be at least "high".
3. notifiable: true if this plausibly meets a threshold for mandatory regulator notification (serious injury, dangerous incident, equipment failure with potential for serious harm) — if uncertain, set true.
4. summary: a short, formal, factual incident report paragraph suitable for a safety register (rewrite the worker's description professionally, do not invent details not stated).
5. suggestedActions: a short list (0-4) of plain-English corrective actions a site manager should consider.

Respond with ONLY valid JSON, no markdown fences, no commentary, in this exact shape:
{"incidentType": string, "severity": string, "notifiable": boolean, "summary": string, "suggestedActions": string[], "confidence": number between 0 and 1}`;

    const content: unknown[] = [{ type: "text", text: prompt }];
    if (photo && (photo.mimeType === "image/png" || photo.mimeType === "image/jpeg" || photo.mimeType === "image/jpg")) {
      const base64 = Buffer.from(photo.buffer).toString("base64");
      content.unshift({ type: "image", source: { type: "base64", media_type: photo.mimeType, data: base64 } });
    }

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: content as never }],
    });

    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    const validTypes: IncidentType[] = ["injury", "near_miss", "property_damage", "environmental", "other"];
    const validSeverities: IncidentSeverity[] = ["low", "medium", "high", "critical"];

    return {
      incidentType: validTypes.includes(parsed.incidentType) ? parsed.incidentType : "other",
      severity: validSeverities.includes(parsed.severity) ? parsed.severity : "medium",
      notifiable: !!parsed.notifiable,
      summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : description,
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions.slice(0, 4) : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
  } catch {
    return cautiousFallback(description);
  }
}
