import MetricCard from "@/components/portal/MetricCard";
import EmployeeTable from "@/components/portal/EmployeeTable";
import Link from "next/link";
import { cookies } from "next/headers";
import { UserCheck, Clock, FileX, AlertTriangle, CalendarDays, Timer, FilePlus } from "lucide-react";
import { MOCK_ONBOARDING } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase";

async function getClientId() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId; } catch { return null; }
}

export default async function OnboardingPage() {
  const clientId = await getClientId();

  let records = MOCK_ONBOARDING;

  if (clientId) {
    const { data } = await supabaseAdmin()
      .from("onboarding")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      records = data.map((r) => ({
        id: r.id,
        clientId: r.client_id,
        employeeName: r.employee_name,
        role: r.role,
        department: r.department || "",
        startDate: r.start_date,
        status: r.status as "In Progress" | "Complete" | "At Risk" | "Cancelled",
        riskLevel: r.risk_level as "Low" | "Medium" | "High" | "Critical",
        progress: r.progress,
        missingDocuments: r.missing_documents,
        manager: r.manager || "",
        email: "",
        phone: "",
        lastContacted: r.created_at,
        nextAction: "",
        documents: [],
        communications: [],
        notes: "",
      }));
    }
  }

  const active = records.filter((r) => !["Complete", "Cancelled"].includes(r.status)).length;
  const completed = records.filter((r) => r.status === "Complete").length;
  const missingDocs = records.reduce((acc, r) => acc + r.missingDocuments, 0);
  const highRisk = records.filter((r) => ["High", "Critical"].includes(r.riskLevel)).length;
  const startingThisWeek = records.filter((r) => {
    const start = new Date(r.startDate);
    const now = new Date();
    const diff = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Onboarding Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">AI Onboarding Assistant — current activity and employee progress.</p>
        </div>
        <Link
          href="/portal/forms/new-employee"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors"
        >
          <FilePlus size={15} /> Add Employee
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Active Onboardings" value={active} icon={UserCheck} accent="blue" />
        <MetricCard label="Completed This Month" value={completed} icon={Clock} accent="green" />
        <MetricCard label="Missing Documents" value={missingDocs} icon={FileX} accent="amber" />
        <MetricCard label="High Risk" value={highRisk} icon={AlertTriangle} accent="red" />
        <MetricCard label="Starting This Week" value={startingThisWeek} icon={CalendarDays} accent="cyan" />
        <MetricCard label="Avg. Onboarding Time" value="8 days" icon={Timer} accent="default" />
      </div>

      <div>
        <h2 className="font-heading font-semibold text-text-primary mb-4">All Employees</h2>
        <EmployeeTable records={records} />
      </div>
    </div>
  );
}
