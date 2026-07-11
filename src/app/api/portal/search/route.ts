import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getClientId(req: NextRequest): string | null {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId || null; } catch { return null; }
}

export interface SearchResult {
  id: string;
  type: "worker" | "site" | "project" | "requirement" | "document";
  title: string;
  subtitle: string;
  href: string;
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = supabaseAdmin();
  const like = `%${q}%`;

  const [workersRes, sitesRes, projectsRes, templatesRes, docsRes] = await Promise.all([
    supabase
      .from("onboarding")
      .select("id, employee_name, email, phone, role")
      .eq("client_id", clientId)
      .or(`employee_name.ilike.${like},email.ilike.${like},phone.ilike.${like},role.ilike.${like}`)
      .limit(8),
    supabase.from("sites").select("id, name").eq("client_id", clientId).ilike("name", like).limit(5),
    supabase.from("projects").select("id, name, site_location").eq("client_id", clientId).ilike("name", like).limit(5),
    supabase.from("requirement_templates").select("id, name, category").eq("client_id", clientId).ilike("name", like).limit(5),
    supabase
      .from("documents")
      .select("id, name, onboarding_id, onboarding:onboarding_id(employee_name)")
      .eq("client_id", clientId)
      .ilike("name", like)
      .limit(6),
  ]);

  const results: SearchResult[] = [];

  for (const w of workersRes.data || []) {
    results.push({
      id: w.id, type: "worker",
      title: w.employee_name,
      subtitle: [w.role, w.email, w.phone].filter(Boolean).join(" · "),
      href: `/portal/staff/${w.id}`,
    });
  }
  for (const s of sitesRes.data || []) {
    results.push({ id: s.id, type: "site", title: s.name, subtitle: "Site", href: "/portal/requirements" });
  }
  for (const p of projectsRes.data || []) {
    results.push({ id: p.id, type: "project", title: p.name, subtitle: p.site_location || "Project", href: `/portal/scheduler/projects/${p.id}` });
  }
  for (const t of templatesRes.data || []) {
    results.push({ id: t.id, type: "requirement", title: t.name, subtitle: t.category, href: "/portal/requirements" });
  }
  for (const d of docsRes.data || []) {
    const worker = d.onboarding as unknown as { employee_name?: string } | null;
    results.push({
      id: d.id, type: "document", title: d.name,
      subtitle: worker?.employee_name ? `Belongs to ${worker.employee_name}` : "Document",
      href: d.onboarding_id ? `/portal/staff/${d.onboarding_id}` : "/portal/onboarding",
    });
  }

  return NextResponse.json({ results });
}
