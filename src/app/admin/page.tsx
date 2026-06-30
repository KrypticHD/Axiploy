import StatusPill from "@/components/portal/StatusPill";
import { CheckCircle2, Activity, ChevronRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { cookies } from "next/headers";

async function getAdminSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default async function AdminPage() {
  const [session, clientsRes, agentsRes, usersRes] = await Promise.all([
    getAdminSession(),
    supabaseAdmin().from("clients").select("id, name, plan, created_at").order("created_at", { ascending: false }),
    supabaseAdmin().from("digital_employees").select("client_id, status"),
    supabaseAdmin().from("users").select("client_id, email").eq("role", "client_admin"),
  ]);

  const clients = clientsRes.data || [];
  const agents = agentsRes.data || [];
  const emailByClient = (usersRes.data || []).reduce<Record<string, string>>((acc, u) => {
    if (!acc[u.client_id]) acc[u.client_id] = u.email;
    return acc;
  }, {});

  const agentCountByClient = agents.reduce<Record<string, number>>((acc, a) => {
    acc[a.client_id] = (acc[a.client_id] || 0) + 1;
    return acc;
  }, {});

  const activeAgents = agents.filter((a) => a.status === "Active").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Axiploy Admin Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Internal overview of all clients and system health.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Clients", value: clients.length, icon: CheckCircle2 },
          { label: "Active AI Agents", value: activeAgents, icon: Activity },
          { label: "Total Agents Assigned", value: agents.length, icon: CheckCircle2 },
        ].map((m) => (
          <div key={m.label} className="glass rounded-2xl p-5">
            <p className="text-text-muted text-xs mb-2">{m.label}</p>
            <p className="font-heading text-2xl font-bold text-text-primary">{m.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-heading font-semibold text-text-primary mb-4">Clients</h2>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Business", "Email", "Plan", "AI Agents", "Created", ""].map((h) => (
                  <th key={h} className="text-left text-text-muted text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-text-muted text-sm py-10">No clients yet.</td>
                </tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-text-primary text-sm font-medium">{c.name}</td>
                  <td className="px-5 py-4 text-text-muted text-sm">{emailByClient[c.id] || "—"}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 capitalize">
                      {c.plan || "starter"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-text-primary text-sm">{agentCountByClient[c.id] || 0}</td>
                  <td className="px-5 py-4 text-text-muted text-sm">
                    {new Date(c.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-1 text-accent-cyan text-xs hover:underline">
                      Manage <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {session && (
        <div className="glass rounded-2xl p-5 border border-amber-500/15">
          <p className="text-amber-300 text-sm font-medium">Logged in as: {session.name} ({session.email})</p>
          <p className="text-text-muted text-xs mt-1">This area is restricted to Axiploy internal team members only.</p>
        </div>
      )}
    </div>
  );
}
