import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  await supabaseAdmin().auth.resetPasswordForEmail(email, {
    redirectTo: "https://axiploy.com/portal/reset-password",
  });

  // Always return success to avoid email enumeration
  return NextResponse.json({ success: true });
}
