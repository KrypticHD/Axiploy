import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, company, industry, email, adminHeadache } = await req.json();

  if (!name || !company || !industry || !email || !adminHeadache) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("beta_signups").insert({
    name,
    company,
    industry,
    email,
    admin_headache: adminHeadache,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify Cain via Resend
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@axiploy.com",
        to: "cainbrammer2@hotmail.com",
        subject: `New Beta Signup — ${company}`,
        html: `<p><strong>${name}</strong> from <strong>${company}</strong> (${industry}) signed up for beta.</p><p>Email: ${email}</p><p>Biggest admin headache: ${adminHeadache}</p>`,
      }),
    });
  } catch {}

  return NextResponse.json({ success: true });
}
