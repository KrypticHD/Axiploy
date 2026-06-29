import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const session = JSON.parse(raw);
    return NextResponse.json({
      name: session.name || "User",
      role: session.role || "client_admin",
      clientName: session.clientName || "My Company",
      email: session.email || "",
    });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
