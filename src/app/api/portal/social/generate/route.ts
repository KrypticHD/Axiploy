import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface AgentConfig {
  brandVoice?: string;
  postFrequencyPerWeek?: number;
  contentCategories?: string[];
  platforms?: { facebook?: string; instagram?: string; linkedin?: string; twitter?: string };
  postApprovalRequired?: boolean;
  hashtags?: string[];
}

export async function POST(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId?: string; clientName?: string; id?: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  if (!session.clientId) return NextResponse.json({ error: "No client context" }, { status: 400 });

  const { imageUrl, context: userContext } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI generation not configured — add ANTHROPIC_API_KEY" }, { status: 503 });
  }

  // Fetch agent config for this client
  const { data: agentData } = await supabaseAdmin()
    .from("digital_employees")
    .select("config")
    .eq("client_id", session.clientId)
    .eq("type", "social")
    .single();

  const config: AgentConfig = agentData?.config || {};
  const brandVoice = config.brandVoice || "Professional";
  const categories = config.contentCategories?.join(", ") || "company updates, industry insights";
  const hashtags = config.hashtags?.map((h: string) => `#${h}`).join(" ") || "";
  const clientName = session.clientName || "our company";

  // Fetch image as base64
  let imageBase64: string;
  let imageMediaType: "image/png" | "image/jpeg" | "image/webp";
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return NextResponse.json({ error: "Could not fetch image" }, { status: 400 });
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const validTypes = ["image/png", "image/jpeg", "image/webp"] as const;
    imageMediaType = validTypes.find((t) => contentType.includes(t)) || "image/jpeg";
    const imgBuffer = await imgRes.arrayBuffer();
    imageBase64 = Buffer.from(imgBuffer).toString("base64");
  } catch {
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }

  const prompt = `You are an expert social media manager for ${clientName}.

Brand voice: ${brandVoice}
Content topics: ${categories}
${hashtags ? `Preferred hashtags: ${hashtags}` : ""}
${userContext ? `Additional context: ${userContext}` : ""}

Look at this image and generate 4 platform-specific social media posts.

Return ONLY valid JSON with no other text, in this exact format:
{
  "facebook": "post content here",
  "instagram": "post content + hashtags here",
  "linkedin": "post content here",
  "twitter": "post content here"
}

Rules:
- Facebook: 200–500 characters, conversational and engaging, end with a question or call to action
- Instagram: 150–250 characters of caption, then a blank line, then 5–8 relevant hashtags
- LinkedIn: 300–500 characters, professional tone, include a business insight or takeaway
- Twitter: under 270 characters total, punchy and direct, include 1–2 hashtags inline
- Match the ${brandVoice} brand voice throughout
- Do not mention platform names in the content itself`;

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let drafts: { facebook: string; instagram: string; linkedin: string; twitter: string };
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: imageMediaType, data: imageBase64 } },
          { type: "text", text: prompt },
        ],
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    // Strip markdown code fences if Claude adds them
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    drafts = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Failed to generate posts — check ANTHROPIC_API_KEY and try again" }, { status: 500 });
  }

  // Insert 4 rows with shared post_group_id
  const postGroupId = crypto.randomUUID();
  const platforms: Array<"facebook" | "instagram" | "linkedin" | "twitter"> = ["facebook", "instagram", "linkedin", "twitter"];

  const rows = platforms.map((platform) => ({
    client_id: session.clientId,
    post_group_id: postGroupId,
    platform,
    content: drafts[platform],
    image_url: imageUrl,
    status: "draft",
  }));

  const { data: posts, error: insertError } = await supabaseAdmin()
    .from("social_posts")
    .insert(rows)
    .select();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabaseAdmin().from("activity_log").insert({
    client_id: session.clientId,
    digital_employee: "AI Social Media Manager",
    action: "Generated 4 platform posts",
    details: `From photo — Facebook, Instagram, LinkedIn, Twitter`,
    status: "success",
  });

  return NextResponse.json({ success: true, posts });
}
