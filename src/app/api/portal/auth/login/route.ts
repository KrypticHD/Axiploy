import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  // Sign in with Supabase Auth
  const { data, error } = await supabaseAdmin().auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Fetch user profile from our users table
  const { data: profile } = await supabaseAdmin()
    .from("users")
    .select("*, clients(name)")
    .eq("id", data.user.id)
    .single();

  const sessionData = {
    id: data.user.id,
    email: data.user.email,
    name: profile?.name || data.user.email,
    role: profile?.role || "client_admin",
    clientId: profile?.client_id,
    clientName: profile?.clients?.name || "My Company",
    accessToken: data.session.access_token,
  };

  const res = NextResponse.json({ success: true });
  res.cookies.set("axiploy_session", JSON.stringify(sessionData), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return res;
}
