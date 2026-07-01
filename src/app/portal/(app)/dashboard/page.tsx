import MetricCard from "@/components/portal/MetricCard";
import ActivityItem from "@/components/portal/ActivityItem";
import StatusPill from "@/components/portal/StatusPill";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Bot, Clock, CheckSquare, AlertTriangle, BarChart2,
  UserCheck, ClipboardList, TrendingUp, ArrowRight, Plus,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

const deIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  onboarding: UserCheck, admin: ClipboardList, growth: TrendingUp,
};
const deLinks: Record<string, string> = {
  onboarding: "/portal/onboarding", admin: "/portal/activity", growth: "/portal/workforce",
};

async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

type ActivityEntry = { id: string; clientId: string; digitalEmployee: string; action: string; result: string; timestamp: string; status: "success" | "warning" | "error" };
type DigitalEmployee = { id: string; clientId: string; name: string; type: "onboarding" | "admin" | "growth"; status: "Active" | "Paused" | "Setup"; stats: { label: string; value: string }[] };

export default async function DashboardPage() {
  const session = await getSession();
  const clientId = session?.clientId;
  const firstName = session?.name?.split(" ")[0] || "there";
  const clientName = session?.clientName || "your company";

  let pendingApprovals = 0;
  let highRiskItems = 0;
  let recentActivity: ActivityEntry[] = [];
  let digitalEmployees: DigitalEmployee[] = [];

  if (clientId) {
    const supabase = supabaseAdmin();
    const [approvalsRes, onboardingRes, activityRes, deRes] = await Promise.all([
      supabase.from("approvals").select("id").eq("client_id", clientId).eq("status", "pending"),
      supabase.from("onboarding").select("id, status").eq("client_id", clientId),
      supabase.from("activity_log").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(5),
      supabase.from("digital_employees").select("*").eq("client_id", clientId),
    ]);

    pendingApprovals = approvalsRes.data?.length ?? 0;
    highRiskItems = (onboardingRes.data || []).filter((r) => r.status === "High").length;

    if (activityRes.data && activityRes.data.length > 0) {
      recentActivity = activityRes.data.map((a) => ({
        id: a.id, clientId: clientId, digitalEmployee: a.digital_employee,
        action: a.action, result: a.details || "", timestamp: a.created_at,
        status: a.status as "success" | "warning" | "error",
      }));
    }

    if (deRes.data && deRes.data.length > 0) {
      // Compute real stats for each agent type from source tables
      const [onboardingAll, emailDrafts, socialPosts] = await Promise.all([
        supabase.from("onboarding").select("id, status").eq("client_id", clientId),
        supabase.from("admin_email_drafts").select("id, status").eq("client_id", clientId),
        supabase.from("social_posts").select("id, status").eq("client_id", clientId),
      ]);

      const ob = onboardingAll.data || [];
      const obTotal = ob.length;
      const obComplete = ob.filter((r) => r.status === "Complete").length;

      const ed = emailDrafts.data || [];
      const edSent = ed.filter((r) => r.status === "sent").length;

      const sp = socialPosts.data || [];
      const spApproved = sp.filter((r) => r.status === "approved" || r.status === "published").length;

      const statsForType = (type: string): { tasks: number; hours: number; rate: number; label: string } => {
        if (type === "onboarding") {
          const tasks = obTotal;
          const hours = obComplete * 4; // 4h saved per completed onboarding
          const rate = obTotal > 0 ? Math.round((obComplete / obTotal) * 100) : 100;
          return { tasks, hours, rate, label: "Employees Managed" };
        }
        if (type === "admin") {
          const tasks = ed.length;
          const hours = Math.round(tasks * 0.25); // 15 min per drafted email
          const rate = tasks > 0 ? Math.round((edSent / tasks) * 100) : 100;
          return { tasks, hours, rate, label: "Emails Drafted" };
        }
        if (type === "social") {
          const tasks = sp.length;
          const hours = Math.round(spApproved * 0.5); // 30 min per approved post
          const rate = tasks > 0 ? Math.round((spApproved / tasks) * 100) : 100;
          return { tasks, hours, rate, label: "Posts Generated" };
        }
        return { tasks: 0, hours: 0, rate: 100, label: "Tasks" };
      };

      digitalEmployees = deRes.data.map((de) => {
        const computed = statsForType(de.type);
        const daysActive = Math.max(1, Math.floor((Date.now() - new Date(de.created_at).getTime()) / 86400000));
        const isNew = computed.tasks === 0;

        // Write computed stats back to DB (fire-and-forget)
        supabase.from("digital_employees").update({
          tasks_completed: computed.tasks,
          hours_saved: computed.hours,
          success_rate: computed.rate,
        }).eq("id", de.id).then(() => {});

        return {
          id: de.id, clientId: clientId, name: de.name, type: de.type,
          daysActive, isNew,
          status: (de.status === "Error" ? "Paused" : de.status) as "Active" | "Paused" | "Setup",
          stats: isNew
            ? [
                { label: "Status", value: "Active" },
                { label: "Days Running", value: String(daysActive) },
                { label: "Ready to work", value: "✓" },
              ]
            : [
                { label: computed.label, value: String(computed.tasks) },
                { label: "Hours Saved", value: `${computed.hours}h` },
                { label: "Success Rate", value: `${computed.rate}%` },
              ],
        };
      });
    }
  }

  const tasksCompleted = digitalEmployees.reduce((acc, de) => {
    const taskStat = de.stats.find((s) => s.label === "Tasks" || s.label === "Tasks Completed");
    return acc + (parseInt(String(taskStat?.value || "0")) || 0);
  }, 0);

  const hoursSaved = digitalEmployees.reduce((acc, de) => {
    const hourStat = de.stats.find((s) => String(s.label).includes("Hour"));
    return acc + (parseFloat(String(hourStat?.value || "0")) || 0);
  }, 0);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Good morning, {firstName}</h1>
        <p className="text-text-muted text-sm mt-1">
          Here&apos;s what your AI workforce has been doing for {clientName}.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Active Employees" value={digitalEmployees.length} icon={Bot} accent="blue" />
        <MetricCard label="Tasks Completed" value={tasksCompleted} icon={CheckSquare} accent="cyan" sub="This month" />
        <MetricCard label="Hours Saved" value={`${hoursSaved}h`} icon={Clock} accent="green" sub="This month" />
        <MetricCard label="Pending Approvals" value={pendingApprovals} icon={CheckSquare} accent="amber" />
        <MetricCard label="High Risk Items" value={highRiskItems} icon={AlertTriangle} accent="red" />
        <MetricCard label="Report Status" value={digitalEmployees.length > 0 ? "Ready" : "No data"} icon={BarChart2} accent="cyan" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-text-primary">AI Workforce</h2>
            <Link href="/portal/workforce" className="text-accent-cyan text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {digitalEmployees.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center border border-white/[0.06]">
              <Bot size={28} className="text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-primary text-sm font-medium">No AI employees configured yet</p>
              <p className="text-text-muted text-xs mt-1 mb-4">Your digital workforce will appear here once set up by the Axiploy team.</p>
              <Link href="/portal/support" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors">
                <Plus size={12} /> Request setup
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {digitalEmployees.map((de) => {
                const typeKey = "type" in de ? de.type : "onboarding";
                const Icon = deIcons[typeKey] || Bot;
                const href = deLinks[typeKey] || "/portal/workforce";
                return (
                  <div key={de.id} className={`glass rounded-2xl p-5 border transition-colors ${(de as { isNew?: boolean }).isNew ? "border-accent-blue/15 hover:border-accent-blue/30" : "border-white/[0.08] hover:border-accent-blue/20"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center">
                          <Icon size={16} className="text-accent-cyan" />
                        </div>
                        <p className="text-text-primary text-sm font-semibold">{de.name}</p>
                      </div>
                      <StatusPill status={de.status} />
                    </div>
                    {(de as { isNew?: boolean }).isNew && (
                      <div className="mb-3 px-3 py-2 rounded-xl bg-accent-blue/5 border border-accent-blue/15 text-xs text-accent-blue/80">
                        Your agent is active and monitoring — stats will build as it works.
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {de.stats.map((s) => (
                        <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                          <p className="font-heading font-bold text-text-primary text-lg">{s.value}</p>
                          <p className="text-text-muted text-[10px] mt-0.5 leading-tight">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <Link href={href} className="mt-4 flex items-center gap-1.5 text-xs text-accent-cyan hover:text-accent-blue transition-colors">
                      View details <ArrowRight size={12} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-text-primary">Recent Activity</h2>
            <Link href="/portal/activity" className="text-accent-cyan text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-white/[0.06]">
              <BarChart2 size={22} className="text-text-muted/30 mx-auto mb-2" />
              <p className="text-text-muted text-xs">No activity yet</p>
            </div>
          ) : (
            <div className="glass rounded-2xl px-5 py-1">
              {recentActivity.map((entry) => (
                <ActivityItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
