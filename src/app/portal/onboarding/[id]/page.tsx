import { notFound } from "next/navigation";
import Link from "next/link";
import StatusPill from "@/components/portal/StatusPill";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import {
  ArrowLeft, CheckCircle2, XCircle, Mail, Phone,
  User, Calendar, Briefcase, AlertTriangle, FileCheck, StickyNote, Send, Trash2,
} from "lucide-react";
import DeleteOnboardingButton from "./DeleteOnboardingButton";

async function getClientId() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("axiploy_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw).clientId; } catch { return null; }
}

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = await getClientId();

  const { data: emp, error } = await supabaseAdmin()
    .from("onboarding")
    .select("*")
    .eq("id", id)
    .eq("client_id", clientId)
    .single();

  if (error || !emp) notFound();

  const { data: documents } = await supabaseAdmin()
    .from("documents")
    .select("*")
    .eq("onboarding_id", id)
    .order("created_at", { ascending: true });

  const docs = documents || [];
  const received = docs.filter((d) => d.received).length;
  const total = docs.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div>
        <Link href="/portal/onboarding" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-[13px] transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Onboarding
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-text-primary">{emp.employee_name}</h1>
            <p className="text-text-muted text-[13px] mt-1">{emp.role}{emp.department ? ` · ${emp.department}` : ""}{emp.manager ? ` · Manager: ${emp.manager}` : ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <StatusPill status={emp.status} size="md" />
            <StatusPill status={emp.risk_level} size="md" />
            <DeleteOnboardingButton id={id} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: details + documents */}
        <div className="lg:col-span-3 space-y-5">
          {/* Employee info */}
          <div className="glass rounded-xl p-5">
            <h2 className="font-heading font-semibold text-text-primary mb-4">Employee Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: User, label: "Full Name", value: emp.employee_name },
                { icon: Mail, label: "Email", value: emp.email || "—" },
                { icon: Phone, label: "Phone", value: emp.phone || "—" },
                { icon: Briefcase, label: "Role", value: emp.role },
                { icon: Calendar, label: "Start Date", value: emp.start_date ? new Date(emp.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                { icon: User, label: "Manager", value: emp.manager || "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon size={14} className="text-text-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-text-muted text-xs">{item.label}</p>
                    <p className="text-text-primary text-[13px] mt-0.5">{item.value}</p>
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
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-text-primary">Documents</h2>
              <span className="text-text-muted text-[13px]">{received}/{total} received</span>
            </div>
            {total > 0 && (
              <div className="w-full bg-white/[0.04] rounded-full h-1.5 mb-5">
                <div
                  className="bg-gradient-to-r from-accent-blue to-accent-cyan h-1.5 rounded-full transition-all"
                  style={{ width: `${total > 0 ? (received / total) * 100 : 0}%` }}
                />
              </div>
            )}
            {docs.length === 0 ? (
              <p className="text-text-muted text-[13px]">No documents required.</p>
            ) : (
              <ul className="space-y-2.5">
                {docs.map((doc) => (
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
                    <div className="flex items-center gap-2">
                      {doc.received && doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-blue hover:underline">View</a>
                      )}
                      {doc.received && doc.received_at && (
                        <span className="text-text-muted/60 text-xs shrink-0">
                          {new Date(doc.received_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-xl p-5">
            <h2 className="font-heading font-semibold text-text-primary mb-4">Actions</h2>
            <div className="space-y-2.5">
              {[
                { icon: Send, label: "Send Reminder", accent: "blue" },
                { icon: FileCheck, label: "Mark Complete", accent: "green" },
                { icon: StickyNote, label: "Add Note", accent: "default" },
                { icon: AlertTriangle, label: "Pause Onboarding", accent: "amber" },
              ].map((action) => {
                const colours: Record<string, string> = {
                  blue: "bg-accent-blue/10 hover:bg-accent-blue/20 border-accent-blue/20 text-accent-blue",
                  green: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-300",
                  amber: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-300",
                  default: "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-text-muted",
                };
                return (
                  <button key={action.label} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-colors ${colours[action.accent]}`}>
                    <action.icon size={15} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <p className="text-text-muted text-xs font-medium mb-1">Upload Link</p>
            <p className="text-accent-blue text-xs break-all">
              {emp.token ? `axiploy.com/onboard/${emp.token}` : "No link available"}
            </p>
          </div>

          <div className="glass rounded-xl p-4">
            <p className="text-text-muted text-xs font-medium mb-1">Added</p>
            <p className="text-text-primary text-[13px]">
              {new Date(emp.created_at).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
