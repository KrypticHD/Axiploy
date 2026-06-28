import MetricCard from "@/components/portal/MetricCard";
import ActivityItem from "@/components/portal/ActivityItem";
import StatusPill from "@/components/portal/StatusPill";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Bot, Clock, CheckSquare, AlertTriangle, BarChart2,
  UserCheck, ClipboardList, TrendingUp, ArrowRight, Plus,
} from "lucide-react";
import { MOCK_METRICS, MOCK_DIGITAL_EMPLOYEES, MOCK_ACTIVITY } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase";
import { isEmptyPreview } from "@/lib/preview";

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

export default async function DashboardPage() {
  const [session, emptyPreview] = await Promise.all([getSession(), isEmptyPreview()]);
  const clientId = session?.clientId;
  const firstName = session?.name?.split(" ")[0] || "there";
  const clientName = session?.clientName || "your company";

  let pendingApprovals = 0;
  let highRiskItems = 0;
  let recentActivity: typeof MOCK_ACTIVITY = [];
  let digitalEmployees: typeof MOCK_DIGITAL_EMPLOYEES = [];

  if (clientId) {
    const supabase = supabaseAdmin();
    const [approvalsRes, onboardingRes, activityRes, deRes] = await Promise.all([
      supabase.from("approvals").select("id").eq("client_id", clientId).eq("status", "pending"),
      supabase.from("onboarding").select("id").eq("client_id", clientId).eq("risk_level", "High"),
      supabase.from("activity_log").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(5),
      supabase.from("digital_employees").select("*").eq("client_id", clientId),
    ]);

    pendingApprovals = approvalsRes.data?.length ?? 0;
    highRiskItems = onboardingRes.data?.length ?? 0;

    if (activityRes.data && activityRes.data.length > 0) {
      recentActivity = activityRes.data.map((a) => ({
        id: a.id, clientId: clientId, digitalEmployee: a.digital_employee,
        action: a.action, result: a.details || "", timestamp: a.created_at,
        status: a.status as "success" | "warning" | "error",
      }));
    } else if (!emptyPreview) {
      recentActivity = MOCK_ACTIVITY.slice(0, 5);
    }

    if (deRes.data && deRes.data.length > 0) {
      digitalEmployees = deRes.data.map((de) => ({
        id: de.id, clientId: clientId, name: de.name, type: "onboarding" as const,
        status: (de.status === "Error" ? "Paused" : de.status) as "Active" | "Paused" | "Setup",
        stats: [
          { label: "Tasks", value: String(de.tasks_completed) },
          { label: "Hours Saved", value: `${de.hours_saved}h` },
          { label: "Success Rate", value: `${de.success_rate}%` },
        ],
      }));
    } else if (!emptyPreview) {
      digitalEmployees = MOCK_DIGITAL_EMPLOYEES;
    }
  } else if (!emptyPreview) {
    recentActivity = MOCK_ACTIVITY.slice(0, 5);
    digitalEmployees = MOCK_DIGITAL_EMPLOYEES;
    pendingApprovals = MOCK_METRICS.pendingApprovals;
    highRiskItems = MOCK_METRICS.highRiskItems;
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
        <MetricCard label="Report Status" value={emptyPreview ? "No data" : "Ready"} icon={BarChart2} accent="cyan" />
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
                  <div key={de.id} className="glass rounded-2xl p-5 border border-white/[0.08] hover:border-accent-blue/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center">
                          <Icon size={16} className="text-accent-cyan" />
                        </div>
                        <p className="text-text-primary text-sm font-semibold">{de.name}</p>
                      </div>
                      <StatusPill status={de.status} />
                    </div>
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
