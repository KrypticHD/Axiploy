import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import AgentManager from "./AgentManager";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [clientRes, agentsRes, onboardingRes, workflowRes, allClientsRes] = await Promise.all([
    supabaseAdmin().from("clients").select("id, name, plan, created_at").eq("id", id).single(),
    supabaseAdmin().from("digital_employees").select("id, name, type, status, tasks_completed, hours_saved, success_rate, config").eq("client_id", id).order("created_at", { ascending: true }),
    supabaseAdmin().from("onboarding").select("id").eq("client_id", id),
    supabaseAdmin().from("workflow_runs").select("status, created_at").eq("client_id", id).order("created_at", { ascending: false }).limit(1),
    supabaseAdmin().from("clients").select("id, name"),
  ]);

  if (!clientRes.data) notFound();

  const client = clientRes.data;
  const agents = agentsRes.data || [];
  const employeesManaged = (onboardingRes.data || []).length;
  const lastRun = (workflowRes.data || [])[0] || null;
  const allClients = (allClientsRes.data || []).filter((c) => c.id !== id);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Admin
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 border border-accent-blue/15 flex items-center justify-center">
              <Building2 size={22} className="text-accent-cyan" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-text-primary">{client.name}</h1>
              <p className="text-text-muted text-sm mt-0.5 capitalize">{client.plan || "starter"} plan</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 capitalize">
            {client.plan || "starter"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Calendar size={13} />
            <p className="text-xs">Client Since</p>
          </div>
          <p className="text-text-primary text-sm font-medium">
            {new Date(client.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-text-muted text-xs mb-1">Agents Assigned</p>
          <p className="text-text-primary text-2xl font-bold font-heading">{agents.length}</p>
        </div>
      </div>

      <AgentManager clientId={id} agents={agents} employeesManaged={employeesManaged} lastRun={lastRun} allClients={allClients} />
    </div>
  );
}
