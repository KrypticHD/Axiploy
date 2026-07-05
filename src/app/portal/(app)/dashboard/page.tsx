import MetricCard from "@/components/portal/MetricCard";
import ActivityItem from "@/components/portal/ActivityItem";
import StatusPill from "@/components/portal/StatusPill";
import AgentAvatar from "@/components/portal/AgentAvatar";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Bot, Clock, CheckSquare, AlertTriangle, BarChart2,
  ArrowRight, Plus, Inbox,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

const deLinks: Record<string, string> = {
  onboarding: "/portal/onboarding",
  admin: "/portal/admin-assist",
  growth: "/portal/workforce",
  social: "/portal/social",
  compliance: "/portal/compliance",
};

async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

type ActivityEntry = { id: string; clientId: string; digitalEmployee: string; action: string; result: string; timestamp: string; status: "success" | "warning" | "error" };
type DigitalEmployee = {
  id: string; clientId: string; name: string; type: string;
  status: "Active" | "Paused" | "Setup";
  working: boolean; isNew: boolean; daysActive: number;
  stats: { label: string; value: string }[];
};

export default async function DashboardPage() {
  const session = await getSession();
  const clientId = session?.clientId;
  const firstName = session?.name?.split(" ")[0] || "there";
  const clientName = session?.clientName || "your company";

  let pendingApprovals = 0;
  let highRiskItems = 0;
  let draftEmails = 0;
  let draftPosts = 0;
  let recentActivity: ActivityEntry[] = [];
  let digitalEmployees: DigitalEmployee[] = [];
  let tasksYesterday = 0;

  if (clientId) {
    const supabase = supabaseAdmin();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [approvalsRes, onboardingRes, activityRes, deRes, recentActRes] = await Promise.all([
      supabase.from("approvals").select("id").eq("client_id", clientId).eq("status", "pending"),
      supabase.from("onboarding").select("id, status, risk_level").eq("client_id", clientId),
      supabase.from("activity_log").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(6),
      supabase.from("digital_employees").select("*").eq("client_id", clientId),
      supabase.from("activity_log").select("digital_employee").eq("client_id", clientId).gte("created_at", dayAgo).limit(200),
    ]);

    pendingApprovals = approvalsRes.data?.length ?? 0;
    highRiskItems = (onboardingRes.data || []).filter((r) => r.risk_level === "High" || r.risk_level === "Critical").length;
    tasksYesterday = recentActRes.data?.length ?? 0;
    const workingNames = new Set((recentActRes.data || []).map((r: { digital_employee: string }) => r.digital_employee));

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
      draftEmails = ed.filter((r) => r.status === "draft").length;

      const sp = socialPosts.data || [];
      const spApproved = sp.filter((r) => r.status === "approved" || r.status === "published").length;
      draftPosts = sp.filter((r) => r.status === "draft").length;

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
        if (type === "compliance") {
          return { tasks: 0, hours: 0, rate: 100, label: "Items Tracked" };
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
          working: workingNames.has(de.name),
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

  const hoursSaved = digitalEmployees.reduce((acc, de) => {
    const hourStat = de.stats.find((s) => String(s.label).includes("Hour"));
    return acc + (parseFloat(String(hourStat?.value || "0")) || 0);
  }, 0);

  const decisionsWaiting = pendingApprovals + draftEmails + draftPosts;
  const workingCount = digitalEmployees.filter((d) => d.working).length;

  const summary =
    digitalEmployees.length === 0
      ? `Your AI workforce for ${clientName} is being set up.`
      : `${workingCount > 0 ? `${workingCount} AI employee${workingCount !== 1 ? "s" : ""} active in the last 24h · ` : ""}${tasksYesterday} action${tasksYesterday !== 1 ? "s" : ""} completed${decisionsWaiting > 0 ? ` · ${decisionsWaiting} decision${decisionsWaiting !== 1 ? "s" : ""} waiting for you` : " · nothing needs you right now"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Good morning, {firstName}</h1>
          <p className="text-text-muted text-[13px] mt-1">{summary}</p>
        </div>
        {decisionsWaiting > 0 && (
          <Link
            href="/portal/inbox"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue-light text-white text-[13px] font-semibold transition-colors shadow-lg shadow-accent-blue/20 shrink-0"
          >
            <Inbox size={14} />
            Review {decisionsWaiting} item{decisionsWaiting !== 1 ? "s" : ""}
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="AI Employees" value={digitalEmployees.length} icon={Bot} accent="blue" />
        <MetricCard label="Actions (24h)" value={tasksYesterday} icon={CheckSquare} accent="cyan" />
        <MetricCard label="Hours Saved" value={`${hoursSaved}h`} icon={Clock} accent="green" sub="This month" />
        <MetricCard label="Decisions Waiting" value={decisionsWaiting} icon={Inbox} accent="amber" />
        <MetricCard label="High Risk" value={highRiskItems} icon={AlertTriangle} accent="red" />
        <MetricCard label="Reports" value={digitalEmployees.length > 0 ? "Ready" : "—"} icon={BarChart2} accent="cyan" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-[15px] font-semibold text-text-primary">Your AI employees</h2>
            <Link href="/portal/workforce" className="text-accent-cyan text-[12px] hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {digitalEmployees.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center border border-white/[0.06]">
              <Bot size={26} className="text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-primary text-[13px] font-medium">No AI employees configured yet</p>
              <p className="text-text-muted text-[12px] mt-1 mb-4">Your digital workforce will appear here once set up by the Axiploy team.</p>
              <Link href="/portal/support" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[12px] font-medium hover:bg-accent-blue/20 transition-colors">
                <Plus size={12} /> Request setup
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {digitalEmployees.map((de) => {
                const href = deLinks[de.type] || "/portal/workforce";
                return (
                  <Link
                    key={de.id}
                    href={href}
                    className="glass rounded-xl p-4 border border-white/[0.06] hover:border-accent-blue/25 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <AgentAvatar type={de.type} size={28} working={de.working} />
                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary text-[13px] font-semibold truncate">{de.name}</p>
                        <p className="text-[11px] mt-px">
                          {de.working ? (
                            <span className="text-emerald-400">working now</span>
                          ) : (
                            <span className="text-text-muted/60">{de.isNew ? `active · ${de.daysActive}d running` : "idle"}</span>
                          )}
                        </p>
                      </div>
                      <StatusPill status={de.status} size="sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {de.stats.map((s) => (
                        <div key={s.label} className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
                          <p className="font-heading font-bold text-text-primary text-[15px] leading-none">{s.value}</p>
                          <p className="text-text-muted text-[9px] mt-1 leading-tight">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-[15px] font-semibold text-text-primary">Activity</h2>
            <Link href="/portal/activity" className="text-accent-cyan text-[12px] hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-white/[0.06]">
              <BarChart2 size={20} className="text-text-muted/30 mx-auto mb-2" />
              <p className="text-text-muted text-[12px]">No activity yet</p>
            </div>
          ) : (
            <div className="glass rounded-xl px-4 py-1 border border-white/[0.06]">
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
