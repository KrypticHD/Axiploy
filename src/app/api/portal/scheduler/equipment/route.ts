import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).clientId || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from("equipment")
    .select("*")
    .eq("client_id", clientId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ equipment: data || [] });
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, type, registration, compliance_expiry } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("equipment")
    .insert({
      client_id: clientId,
      name,
      type: type || null,
      registration: registration || null,
      compliance_expiry: compliance_expiry || null,
      status: "available",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ equipment: data });
}

export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("equipment")
    .update(updates)
    .eq("id", id)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ equipment: data });
}

export async function DELETE(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin()
    .from("equipment")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
