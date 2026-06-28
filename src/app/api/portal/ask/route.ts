import { NextRequest, NextResponse } from "next/server";
import { askEngine } from "@/lib/ask-engine";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // When ANTHROPIC_API_KEY is set in production, swap this for a real API call
    const response = askEngine(message);

    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
