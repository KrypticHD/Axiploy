import { notFound } from "next/navigation";
import Link from "next/link";
import StatusPill from "@/components/portal/StatusPill";
import { MOCK_ONBOARDING } from "@/lib/mock-data";
import {
  ArrowLeft, CheckCircle2, XCircle, Mail, Phone,
  User, Calendar, Briefcase, AlertTriangle, Send, FileCheck, StickyNote,
} from "lucide-react";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const emp = MOCK_ONBOARDING.find((r) => r.id === id);
  if (!emp) notFound();

  const received = emp.documents.filter((d) => d.received).length;
  const total = emp.documents.length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + Header */}
      <div>
        <Link href="/portal/onboarding" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Onboarding
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-text-primary">{emp.employeeName}</h1>
            <p className="text-text-muted text-sm mt-1">{emp.role} · {emp.department} · Manager: {emp.manager}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <StatusPill status={emp.status} size="md" />
            <StatusPill status={emp.riskLevel} size="md" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: details + documents */}
        <div className="lg:col-span-3 space-y-5">
          {/* Employee info */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-heading font-semibold text-text-primary mb-4">Employee Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: User, label: "Full Name", value: emp.employeeName },
                { icon: Mail, label: "Email", value: emp.email },
                { icon: Phone, label: "Phone", value: emp.phone },
                { icon: Briefcase, label: "Role", value: emp.role },
                { icon: Calendar, label: "Start Date", value: new Date(emp.startDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) },
                { icon: User, label: "Manager", value: emp.manager },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon size={14} className="text-text-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-text-muted text-xs">{item.label}</p>
                    <p className="text-text-primary text-sm mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {emp.notes && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-amber-300 text-xs flex items-center gap-1.5">
                  <AlertTriangle size={12} /> {emp.notes}
                </p>
              </div>
            )}
          </div>

          {/* Document checklist */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-text-primary">Documents</h2>
              <span className="text-text-muted text-sm">{received}/{total} received</span>
            </div>
            <div className="w-full bg-white/[0.04] rounded-full h-1.5 mb-5">
              <div
                className="bg-gradient-to-r from-accent-blue to-accent-cyan h-1.5 rounded-full transition-all"
                style={{ width: `${(received / total) * 100}%` }}
              />
            </div>
            <ul className="space-y-2.5">
              {emp.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {doc.received ? (
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle size={15} className={`shrink-0 ${doc.required ? "text-red-400" : "text-text-muted/40"}`} />
                    )}
                    <span className={`text-sm ${doc.received ? "text-text-primary" : doc.required ? "text-orange-300" : "text-text-muted"}`}>
                      {doc.name}
                      {doc.required && !doc.received && <span className="text-red-400 ml-1 text-xs">*</span>}
                    </span>
                  </div>
                  {doc.received && doc.receivedAt && (
                    <span className="text-text-muted/60 text-xs shrink-0">
                      {new Date(doc.receivedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Communication history */}
          {emp.communications.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading font-semibold text-text-primary mb-4">Communication History</h2>
              <div className="space-y-4">
                {emp.communications.map((c) => (
                  <div key={c.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-text-primary text-sm font-medium">{c.subject}</p>
                      <span className="text-text-muted/60 text-xs">
                        {new Date(c.timestamp).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs leading-relaxed">{c.body}</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border ${c.direction === "sent" ? "text-blue-300 border-blue-500/20 bg-blue-500/10" : "text-emerald-300 border-emerald-500/20 bg-emerald-500/10"}`}>
                      {c.direction === "sent" ? "Sent by AI" : "Received"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-heading font-semibold text-text-primary mb-4">Actions</h2>
            <div className="space-y-2.5">
              {[
                { icon: Send, label: "Send Reminder", accent: "blue" },
                { icon: FileCheck, label: "Mark Document Received", accent: "green" },
                { icon: StickyNote, label: "Add Note", accent: "default" },
                { icon: CheckCircle2, label: "Mark Complete", accent: "green" },
                { icon: AlertTriangle, label: "Pause Onboarding", accent: "amber" },
              ].map((action) => {
                const colours: Record<string, string> = {
                  blue: "bg-accent-blue/10 hover:bg-accent-blue/20 border-accent-blue/20 text-accent-blue",
                  green: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-300",
                  amber: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-300",
                  default: "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-text-muted",
                };
                return (
                  <button
                    key={action.label}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${colours[action.accent]}`}
                  >
                    <action.icon size={15} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-text-muted text-xs font-medium mb-1">Next Recommended Action</p>
            <p className="text-text-primary text-sm">{emp.nextAction}</p>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-text-muted text-xs font-medium mb-1">Last Contacted</p>
            <p className="text-text-primary text-sm">
              {new Date(emp.lastContacted).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
