import { MOCK_USER, MOCK_DIGITAL_EMPLOYEES, MOCK_METRICS } from "@/lib/mock-data";
import StatusPill from "@/components/portal/StatusPill";
import { CheckCircle2, Activity } from "lucide-react";

const MOCK_CLIENTS = [
  { id: "client-001", name: "Pinnacle Group", plan: "Pro", activeEmployees: 3, status: "Active" },
  { id: "client-002", name: "Metro Constructions", plan: "Starter", activeEmployees: 1, status: "Active" },
  { id: "client-003", name: "Apex Labour Hire", plan: "Pro", activeEmployees: 2, status: "Setup" },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Axiploy Admin Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Internal overview of all clients and system health.</p>
      </div>

      {/* System health */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Clients", value: MOCK_CLIENTS.length, icon: CheckCircle2, colour: "text-emerald-400" },
          { label: "Active Digital Employees", value: MOCK_DIGITAL_EMPLOYEES.length, icon: Activity, colour: "text-accent-blue" },
          { label: "Tasks This Month", value: MOCK_METRICS.tasksCompleted, icon: CheckCircle2, colour: "text-accent-cyan" },
        ].map((m) => (
          <div key={m.label} className="glass rounded-2xl p-5">
            <p className="text-text-muted text-xs mb-2">{m.label}</p>
            <p className="font-heading text-2xl font-bold text-text-primary">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Client list */}
      <div>
        <h2 className="font-heading font-semibold text-text-primary mb-4">Clients</h2>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Business", "Plan", "Active Employees", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-text-muted text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CLIENTS.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-text-primary text-sm font-medium">{c.name}</td>
                  <td className="px-5 py-4 text-text-muted text-sm">{c.plan}</td>
                  <td className="px-5 py-4 text-text-primary text-sm">{c.activeEmployees}</td>
                  <td className="px-5 py-4"><StatusPill status={c.status} /></td>
                  <td className="px-5 py-4">
                    <button className="text-accent-cyan text-xs hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-amber-500/15">
        <p className="text-amber-300 text-sm font-medium">Logged in as: {MOCK_USER.name} ({MOCK_USER.email})</p>
        <p className="text-text-muted text-xs mt-1">This area is restricted to Axiploy internal team members only.</p>
      </div>
    </div>
  );
}
