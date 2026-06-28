import MetricCard from "@/components/portal/MetricCard";
import ActivityItem from "@/components/portal/ActivityItem";
import StatusPill from "@/components/portal/StatusPill";
import Link from "next/link";
import {
  Bot, Clock, CheckSquare, AlertTriangle, BarChart2,
  UserCheck, ClipboardList, TrendingUp, ArrowRight,
} from "lucide-react";
import {
  MOCK_METRICS, MOCK_DIGITAL_EMPLOYEES, MOCK_ACTIVITY, MOCK_USER,
} from "@/lib/mock-data";

const deIcons = { onboarding: UserCheck, admin: ClipboardList, growth: TrendingUp };
const deLinks = { onboarding: "/portal/onboarding", admin: "/portal/activity", growth: "/portal/workforce" };

export default function DashboardPage() {
  const recentActivity = MOCK_ACTIVITY.slice(0, 5);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Good morning, {MOCK_USER.name.split(" ")[0]}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Here&apos;s what your AI workforce has been doing for {MOCK_USER.clientName}.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Active Employees" value={MOCK_METRICS.activeEmployees} icon={Bot} accent="blue" />
        <MetricCard label="Tasks Completed" value={MOCK_METRICS.tasksCompleted} icon={CheckSquare} accent="cyan" sub="This month" />
        <MetricCard label="Hours Saved" value={`${MOCK_METRICS.hoursSaved}h`} icon={Clock} accent="green" sub="This month" />
        <MetricCard label="Pending Approvals" value={MOCK_METRICS.pendingApprovals} icon={CheckSquare} accent="amber" />
        <MetricCard label="High Risk Items" value={MOCK_METRICS.highRiskItems} icon={AlertTriangle} accent="red" />
        <MetricCard label="Report Status" value="Ready" icon={BarChart2} accent="cyan" sub={MOCK_METRICS.reportStatus} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Workforce */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-text-primary">AI Workforce</h2>
            <Link href="/portal/workforce" className="text-accent-cyan text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid gap-4">
            {MOCK_DIGITAL_EMPLOYEES.map((de) => {
              const Icon = deIcons[de.type];
              const href = deLinks[de.type];
              return (
                <div key={de.id} className="glass rounded-2xl p-5 border border-white/[0.08] hover:border-accent-blue/20 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center">
                        <Icon size={16} className="text-accent-cyan" />
                      </div>
                      <div>
                        <p className="text-text-primary text-sm font-semibold">{de.name}</p>
                      </div>
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
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-text-primary">Recent Activity</h2>
            <Link href="/portal/activity" className="text-accent-cyan text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="glass rounded-2xl px-5 py-1">
            {recentActivity.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
