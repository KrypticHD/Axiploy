"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, UserCheck, ClipboardList, TrendingUp, Bot,
  Settings, ChevronDown, ChevronUp, X, PlusCircle, Check,
  Copy, Clock, Zap, AlertCircle, MinusCircle, CheckCircle2,
  AlertTriangle, Share2,
} from "lucide-react";

const AGENT_TEMPLATES = [
  { type: "onboarding", name: "AI Onboarding Assistant", description: "Automates employee onboarding — documents, forms, follow-ups.", icon: UserCheck },
  { type: "admin", name: "AI Admin Assistant", description: "Scheduling, reporting, data entry, communications.", icon: ClipboardList },
  { type: "growth", name: "AI Growth Assistant", description: "Lead follow-up, client engagement, pipeline management.", icon: TrendingUp },
  { type: "social", name: "AI Social Media Manager", description: "Generate platform posts from photos, manage content calendar, monitor engagement.", icon: Share2 },
];

const DEFAULT_DOCS = ["Employment Contract", "Tax File Number Declaration", "Right to Work", "Bank Details", "Emergency Contact Form"];

const AGENT_VERSION = "1.0.0";

interface AgentConfig {
  // Onboarding fields
  emailSenderName?: string;
  emailSenderAddress?: string;
  reminderFrequencyDays?: number;
  escalationDays?: number;
  managerApproval?: boolean;
  knowledgeBase?: boolean;
  requiredDocuments?: string[];
  // Social media fields
  brandVoice?: string;
  postFrequencyPerWeek?: number;
  contentCategories?: string[];
  platforms?: { facebook?: string; instagram?: string; linkedin?: string; twitter?: string };
  postApprovalRequired?: boolean;
  hashtags?: string[];
  // Admin assistant fields
  reportFrequency?: string;
  emailTone?: string;
  emailSignature?: string;
  outlookEmail?: string;
  taskReminderDays?: number;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  tasks_completed?: number;
  hours_saved?: number;
  success_rate?: number;
  config?: AgentConfig;
}

interface LastRun {
  status: string;
  created_at: string;
}

function liveStatus(agentStatus: string, lastRun: LastRun | null): { label: string; color: string; dot: string } {
  if (agentStatus === "Paused") return { label: "Disabled", color: "text-text-muted", dot: "bg-text-muted/40" };
  if (!lastRun) return { label: "Waiting", color: "text-amber-400", dot: "bg-amber-400" };
  if (lastRun.status === "error" || lastRun.status === "failed") return { label: "Error", color: "text-red-400", dot: "bg-red-400" };
  return { label: "Running", color: "text-emerald-400", dot: "bg-emerald-400" };
}

function formatLastRun(lastRun: LastRun | null): string {
  if (!lastRun) return "Never";
  const diff = Date.now() - new Date(lastRun.created_at).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function setupChecklist(config: AgentConfig | undefined): { label: string; ok: boolean }[] {
  return [
    { label: "Email sender configured", ok: !!(config?.emailSenderAddress) },
    { label: "Required documents set", ok: !!(config?.requiredDocuments?.length) },
    { label: "Reminder frequency set", ok: config?.reminderFrequencyDays !== undefined },
    { label: "Escalation period set", ok: config?.escalationDays !== undefined },
    { label: "Use Company Knowledge enabled", ok: !!config?.knowledgeBase },
  ];
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${value ? "bg-accent-blue" : "bg-white/[0.12]"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function OnboardingConfigPanel({
  agent, clientId, lastRun, employeesManaged, allClients, onSaved,
}: {
  agent: Agent;
  clientId: string;
  lastRun: LastRun | null;
  employeesManaged: number;
  allClients: { id: string; name: string }[];
  onSaved: (id: string, config: AgentConfig) => void;
}) {
  const cfg = agent.config || {};
  const [emailSenderName, setEmailSenderName] = useState(cfg.emailSenderName || "Axiploy");
  const [emailSenderAddress, setEmailSenderAddress] = useState(cfg.emailSenderAddress || "");
  const [reminderFrequencyDays, setReminderFrequencyDays] = useState(cfg.reminderFrequencyDays ?? 2);
  const [escalationDays, setEscalationDays] = useState(cfg.escalationDays ?? 7);
  const [managerApproval, setManagerApproval] = useState(cfg.managerApproval ?? true);
  const [knowledgeBase, setKnowledgeBase] = useState(cfg.knowledgeBase ?? true);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(cfg.requiredDocuments ?? DEFAULT_DOCS);
  const [newDoc, setNewDoc] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [cloning, setCloning] = useState(false);

  const status = liveStatus(agent.status, lastRun);
  const checklist = setupChecklist({ emailSenderName, emailSenderAddress, reminderFrequencyDays, escalationDays, managerApproval, knowledgeBase, requiredDocuments });
  const allGreen = checklist.every((c) => c.ok);

  function addDoc() {
    const trimmed = newDoc.trim();
    if (!trimmed || requiredDocuments.includes(trimmed)) return;
    setRequiredDocuments((prev) => [...prev, trimmed]);
    setNewDoc("");
  }

  async function handleSave() {
    setSaving(true);
    const config: AgentConfig = { emailSenderName, emailSenderAddress, reminderFrequencyDays, escalationDays, managerApproval, knowledgeBase, requiredDocuments };
    const res = await fetch(`/api/admin/clients/${clientId}/agents`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: agent.id, config }),
    });
    setSaving(false);
    if (res.ok) { onSaved(agent.id, config); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  async function handleClone(fromClientId: string) {
    setCloning(true);
    const res = await fetch(`/api/admin/clients/${fromClientId}/agents/clone?type=onboarding`);
    const data = await res.json();
    if (data.config) {
      const c: AgentConfig = data.config;
      if (c.emailSenderName) setEmailSenderName(c.emailSenderName);
      if (c.emailSenderAddress) setEmailSenderAddress(c.emailSenderAddress);
      if (c.reminderFrequencyDays) setReminderFrequencyDays(c.reminderFrequencyDays);
      if (c.escalationDays) setEscalationDays(c.escalationDays);
      if (c.managerApproval !== undefined) setManagerApproval(c.managerApproval);
      if (c.knowledgeBase !== undefined) setKnowledgeBase(c.knowledgeBase);
      if (c.requiredDocuments) setRequiredDocuments(c.requiredDocuments);
    }
    setCloning(false);
    setShowClone(false);
  }

  return (
    <div className="mt-3 space-y-5">

      {/* AI Overview */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">AI Overview</p>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status.dot} ${status.label === "Running" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Employees Managed", value: employeesManaged },
            { label: "Tasks Completed", value: agent.tasks_completed ?? 0 },
            { label: "Hours Saved", value: agent.hours_saved ?? 0 },
            { label: "Success Rate", value: `${agent.success_rate ?? 100}%` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-text-muted text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.06]">
          <Clock size={11} className="text-text-muted/50" />
          <span className="text-text-muted/50 text-[10px]">Last run: {formatLastRun(lastRun)}</span>
          <span className="text-text-muted/30 text-[10px] ml-auto">v{AGENT_VERSION}</span>
        </div>
      </div>

      {/* Setup checklist */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Setup Checklist</p>
          {allGreen
            ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ready for production</span>
            : <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Incomplete</span>
          }
        </div>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.ok
                ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                : <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
              }
              <span className={`text-xs ${item.ok ? "text-text-muted" : "text-amber-400/80"}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Config form */}
      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-5">

        {/* Clone banner */}
        {allClients.length > 0 && (
          <div>
            <button
              onClick={() => setShowClone(!showClone)}
              className="flex items-center gap-2 text-xs text-accent-cyan hover:text-accent-blue transition-colors"
            >
              <Copy size={12} /> Copy configuration from another client
              {showClone ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showClone && (
              <div className="mt-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                {cloning && <p className="text-text-muted text-xs">Copying...</p>}
                {!cloning && allClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleClone(c.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Email sender */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Email Sender</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Sender Name</label>
              <input value={emailSenderName} onChange={(e) => setEmailSenderName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40"
                placeholder="Axiploy" />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Reply-To Address</label>
              <input value={emailSenderAddress} onChange={(e) => setEmailSenderAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40"
                placeholder="onboarding@yourdomain.com" />
            </div>
          </div>
        </div>

        {/* Timing */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Timing</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Reminder Frequency (days)</label>
              <input type="number" min={1} max={30} value={reminderFrequencyDays} onChange={(e) => setReminderFrequencyDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40" />
              <p className="text-text-muted/50 text-[10px] mt-1">Days between document reminders</p>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Escalation Period (days)</label>
              <input type="number" min={1} max={60} value={escalationDays} onChange={(e) => setEscalationDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40" />
              <p className="text-text-muted/50 text-[10px] mt-1">Days before start date to flag as high risk</p>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Options</p>
          <div className="space-y-3">
            {[
              { label: "Require Final Manager Approval", desc: "Manager must approve before onboarding is marked complete", value: managerApproval, set: setManagerApproval },
              { label: "Use Company Knowledge", desc: "AI can reference this client's Knowledge Base documents", value: knowledgeBase, set: setKnowledgeBase },
            ].map(({ label, desc, value, set }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <p className="text-text-primary text-sm">{label}</p>
                  <p className="text-text-muted text-xs mt-0.5">{desc}</p>
                </div>
                <Toggle value={value} onChange={set} />
              </div>
            ))}
          </div>
        </div>

        {/* Required documents */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Required Documents</p>
          <div className="space-y-2 mb-3">
            {requiredDocuments.map((doc) => (
              <div key={doc} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-text-primary text-sm">{doc}</span>
                <button onClick={() => setRequiredDocuments((prev) => prev.filter((d) => d !== doc))} className="text-text-muted hover:text-red-400 transition-colors">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDoc()}
              placeholder="Add document type..."
              className="flex-1 px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40"
            />
            <button onClick={addDoc} disabled={!newDoc.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm hover:bg-accent-blue/20 transition-colors disabled:opacity-40">
              <PlusCircle size={14} /> Add
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
            {saved ? <><Check size={14} /> Saved</> : saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

function socialSetupChecklist(config: AgentConfig | undefined): { label: string; ok: boolean }[] {
  const hasAnyPlatform = !!(config?.platforms?.facebook || config?.platforms?.instagram || config?.platforms?.linkedin || config?.platforms?.twitter);
  return [
    { label: "Brand voice configured", ok: !!config?.brandVoice },
    { label: "At least one platform handle added", ok: hasAnyPlatform },
    { label: "Content categories defined", ok: !!(config?.contentCategories?.length) },
    { label: "Posting frequency set", ok: config?.postFrequencyPerWeek !== undefined },
  ];
}

const BRAND_VOICES = ["Professional", "Casual", "Friendly", "Bold", "Inspirational"];

const EMAIL_TONES = ["Professional", "Friendly", "Concise", "Formal", "Casual"];
const REPORT_FREQUENCIES = ["Daily", "Weekly", "Monthly"];

function adminSetupChecklist(config: AgentConfig | undefined): { label: string; ok: boolean }[] {
  return [
    { label: "Report frequency configured", ok: !!config?.reportFrequency },
    { label: "Email tone set", ok: !!config?.emailTone },
    { label: "Email signature added", ok: !!config?.emailSignature },
    { label: "Outlook email entered", ok: !!config?.outlookEmail },
  ];
}

function AdminConfigPanel({
  agent, clientId, lastRun, allClients, onSaved,
}: {
  agent: Agent;
  clientId: string;
  lastRun: LastRun | null;
  allClients: { id: string; name: string }[];
  onSaved: (id: string, config: AgentConfig) => void;
}) {
  const cfg = agent.config || {};
  const [reportFrequency, setReportFrequency] = useState(cfg.reportFrequency || "Weekly");
  const [emailTone, setEmailTone] = useState(cfg.emailTone || "Professional");
  const [emailSignature, setEmailSignature] = useState(cfg.emailSignature || "");
  const [outlookEmail, setOutlookEmail] = useState(cfg.outlookEmail || "");
  const [taskReminderDays, setTaskReminderDays] = useState(cfg.taskReminderDays ?? 1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [cloning, setCloning] = useState(false);

  const status = liveStatus(agent.status, lastRun);
  const checklist = adminSetupChecklist({ reportFrequency, emailTone, emailSignature, outlookEmail });
  const allGreen = checklist.every((c) => c.ok);

  async function handleSave() {
    setSaving(true);
    const config: AgentConfig = { reportFrequency, emailTone, emailSignature, outlookEmail, taskReminderDays };
    const res = await fetch(`/api/admin/clients/${clientId}/agents`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: agent.id, config }),
    });
    setSaving(false);
    if (res.ok) { onSaved(agent.id, config); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  async function handleClone(fromClientId: string) {
    setCloning(true);
    const res = await fetch(`/api/admin/clients/${fromClientId}/agents/clone?type=admin`);
    const data = await res.json();
    if (data.config) {
      const c: AgentConfig = data.config;
      if (c.reportFrequency) setReportFrequency(c.reportFrequency);
      if (c.emailTone) setEmailTone(c.emailTone);
      if (c.emailSignature) setEmailSignature(c.emailSignature);
      if (c.outlookEmail) setOutlookEmail(c.outlookEmail);
      if (c.taskReminderDays !== undefined) setTaskReminderDays(c.taskReminderDays);
    }
    setCloning(false);
    setShowClone(false);
  }

  return (
    <div className="mt-3 space-y-5">
      {/* AI Overview */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">AI Overview</p>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status.dot} ${status.label === "Running" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Tasks Managed", value: agent.tasks_completed ?? 0 },
            { label: "Hours Saved", value: agent.hours_saved ?? 0 },
            { label: "Success Rate", value: `${agent.success_rate ?? 100}%` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-text-muted text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.06]">
          <Clock size={11} className="text-text-muted/50" />
          <span className="text-text-muted/50 text-[10px]">Last run: {formatLastRun(lastRun)}</span>
          <span className="text-text-muted/30 text-[10px] ml-auto">v{AGENT_VERSION}</span>
        </div>
      </div>

      {/* Setup checklist */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Setup Checklist</p>
          {allGreen
            ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ready for production</span>
            : <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Incomplete</span>}
        </div>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.ok ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> : <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />}
              <span className={`text-xs ${item.ok ? "text-text-muted" : "text-amber-400/80"}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Config form */}
      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-5">
        {allClients.length > 0 && (
          <div>
            <button onClick={() => setShowClone(!showClone)} className="flex items-center gap-2 text-xs text-accent-cyan hover:text-accent-blue transition-colors">
              <Copy size={12} /> Copy configuration from another client
              {showClone ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showClone && (
              <div className="mt-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                {cloning && <p className="text-text-muted text-xs">Copying...</p>}
                {!cloning && allClients.map((c) => (
                  <button key={c.id} onClick={() => handleClone(c.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors">{c.name}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reporting */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Reporting</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Report Frequency</label>
              <select value={reportFrequency} onChange={(e) => setReportFrequency(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40">
                {REPORT_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Task Reminder (days before due)</label>
              <input type="number" min={1} max={7} value={taskReminderDays} onChange={(e) => setTaskReminderDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40" />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Email Drafting</p>
          <div className="space-y-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Default Tone</label>
              <select value={emailTone} onChange={(e) => setEmailTone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40">
                {EMAIL_TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Email Signature</label>
              <textarea value={emailSignature} onChange={(e) => setEmailSignature(e.target.value)}
                placeholder="Kind regards,&#10;John Smith&#10;Operations Manager" rows={3}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40 resize-none" />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Outlook Email (for Phase 2 connection)</label>
              <input value={outlookEmail} onChange={(e) => setOutlookEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
              <p className="text-text-muted/50 text-[10px] mt-1">Used when we connect Microsoft 365 in Phase 2</p>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
            {saved ? <><Check size={14} /> Saved</> : saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SocialConfigPanel({
  agent, clientId, lastRun, allClients, onSaved,
}: {
  agent: Agent;
  clientId: string;
  lastRun: LastRun | null;
  allClients: { id: string; name: string }[];
  onSaved: (id: string, config: AgentConfig) => void;
}) {
  const cfg = agent.config || {};
  const [brandVoice, setBrandVoice] = useState(cfg.brandVoice || "Professional");
  const [postFrequencyPerWeek, setPostFrequencyPerWeek] = useState(cfg.postFrequencyPerWeek ?? 3);
  const [postApprovalRequired, setPostApprovalRequired] = useState(cfg.postApprovalRequired ?? true);
  const [platforms, setPlatforms] = useState(cfg.platforms || { facebook: "", instagram: "", linkedin: "", twitter: "" });
  const [contentCategories, setContentCategories] = useState<string[]>(cfg.contentCategories ?? ["Company updates", "Industry insights"]);
  const [hashtags, setHashtags] = useState<string[]>(cfg.hashtags ?? []);
  const [newCategory, setNewCategory] = useState("");
  const [newHashtag, setNewHashtag] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [cloning, setCloning] = useState(false);

  const status = liveStatus(agent.status, lastRun);
  const checklist = socialSetupChecklist({ brandVoice, postFrequencyPerWeek, platforms, contentCategories, postApprovalRequired });
  const allGreen = checklist.every((c) => c.ok);

  function addCategory() {
    const t = newCategory.trim();
    if (!t || contentCategories.includes(t)) return;
    setContentCategories((prev) => [...prev, t]);
    setNewCategory("");
  }

  function addHashtag() {
    const t = newHashtag.trim().replace(/^#/, "");
    if (!t || hashtags.includes(t)) return;
    setHashtags((prev) => [...prev, t]);
    setNewHashtag("");
  }

  async function handleSave() {
    setSaving(true);
    const config: AgentConfig = { brandVoice, postFrequencyPerWeek, postApprovalRequired, platforms, contentCategories, hashtags };
    const res = await fetch(`/api/admin/clients/${clientId}/agents`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: agent.id, config }),
    });
    setSaving(false);
    if (res.ok) { onSaved(agent.id, config); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  async function handleClone(fromClientId: string) {
    setCloning(true);
    const res = await fetch(`/api/admin/clients/${fromClientId}/agents/clone?type=social`);
    const data = await res.json();
    if (data.config) {
      const c: AgentConfig = data.config;
      if (c.brandVoice) setBrandVoice(c.brandVoice);
      if (c.postFrequencyPerWeek) setPostFrequencyPerWeek(c.postFrequencyPerWeek);
      if (c.postApprovalRequired !== undefined) setPostApprovalRequired(c.postApprovalRequired);
      if (c.platforms) setPlatforms(c.platforms);
      if (c.contentCategories) setContentCategories(c.contentCategories);
      if (c.hashtags) setHashtags(c.hashtags);
    }
    setCloning(false);
    setShowClone(false);
  }

  return (
    <div className="mt-3 space-y-5">
      {/* AI Overview */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">AI Overview</p>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status.dot} ${status.label === "Running" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Posts Generated", value: agent.tasks_completed ?? 0 },
            { label: "Hours Saved", value: agent.hours_saved ?? 0 },
            { label: "Success Rate", value: `${agent.success_rate ?? 100}%` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-text-muted text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.06]">
          <Clock size={11} className="text-text-muted/50" />
          <span className="text-text-muted/50 text-[10px]">Last run: {formatLastRun(lastRun)}</span>
          <span className="text-text-muted/30 text-[10px] ml-auto">v{AGENT_VERSION}</span>
        </div>
      </div>

      {/* Setup checklist */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Setup Checklist</p>
          {allGreen
            ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ready for production</span>
            : <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Incomplete</span>
          }
        </div>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.ok ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> : <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />}
              <span className={`text-xs ${item.ok ? "text-text-muted" : "text-amber-400/80"}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Config form */}
      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-5">
        {/* Clone banner */}
        {allClients.length > 0 && (
          <div>
            <button onClick={() => setShowClone(!showClone)} className="flex items-center gap-2 text-xs text-accent-cyan hover:text-accent-blue transition-colors">
              <Copy size={12} /> Copy configuration from another client
              {showClone ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showClone && (
              <div className="mt-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                {cloning && <p className="text-text-muted text-xs">Copying...</p>}
                {!cloning && allClients.map((c) => (
                  <button key={c.id} onClick={() => handleClone(c.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors">
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brand & Schedule */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Brand & Schedule</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Brand Voice</label>
              <select value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40">
                {BRAND_VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Posts Per Week</label>
              <input type="number" min={1} max={14} value={postFrequencyPerWeek} onChange={(e) => setPostFrequencyPerWeek(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40" />
              <p className="text-text-muted/50 text-[10px] mt-1">Target posts to generate per week</p>
            </div>
          </div>
        </div>

        {/* Platform handles */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Platform Handles</p>
          <div className="grid grid-cols-2 gap-3">
            {(["facebook", "instagram", "linkedin", "twitter"] as const).map((p) => (
              <div key={p}>
                <label className="text-text-muted text-xs mb-1 block capitalize">{p === "twitter" ? "Twitter / X" : p}</label>
                <input value={platforms[p] || ""} onChange={(e) => setPlatforms((prev) => ({ ...prev, [p]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40"
                  placeholder={`@handle`} />
              </div>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Options</p>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div>
              <p className="text-text-primary text-sm">Require Post Approval</p>
              <p className="text-text-muted text-xs mt-0.5">Client must approve each post before it goes to the publish queue</p>
            </div>
            <Toggle value={postApprovalRequired} onChange={setPostApprovalRequired} />
          </div>
        </div>

        {/* Content categories */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Content Categories</p>
          <div className="space-y-2 mb-3">
            {contentCategories.map((cat) => (
              <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-text-primary text-sm">{cat}</span>
                <button onClick={() => setContentCategories((prev) => prev.filter((c) => c !== cat))} className="text-text-muted hover:text-red-400 transition-colors">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder="Add content category..." className="flex-1 px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
            <button onClick={addCategory} disabled={!newCategory.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm hover:bg-accent-blue/20 transition-colors disabled:opacity-40">
              <PlusCircle size={14} /> Add
            </button>
          </div>
        </div>

        {/* Hashtag preferences */}
        <div>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Hashtag Preferences</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {hashtags.map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.10] text-text-muted text-xs">
                #{tag}
                <button onClick={() => setHashtags((prev) => prev.filter((h) => h !== tag))} className="hover:text-red-400 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newHashtag} onChange={(e) => setNewHashtag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHashtag()}
              placeholder="Add hashtag (without #)..." className="flex-1 px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
            <button onClick={addHashtag} disabled={!newHashtag.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm hover:bg-accent-blue/20 transition-colors disabled:opacity-40">
              <PlusCircle size={14} /> Add
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
            {saved ? <><Check size={14} /> Saved</> : saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentManager({
  clientId, agents: initialAgents, employeesManaged, lastRun, allClients,
}: {
  clientId: string;
  agents: Agent[];
  employeesManaged: number;
  lastRun: LastRun | null;
  allClients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [configuringId, setConfiguringId] = useState<string | null>(null);

  const assignedTypes = new Set(agents.map((a) => a.type));
  const available = AGENT_TEMPLATES.filter((t) => !assignedTypes.has(t.type));

  async function handleAdd() {
    if (!selectedType) return;
    setLoading(true);
    const template = AGENT_TEMPLATES.find((t) => t.type === selectedType)!;
    const res = await fetch(`/api/admin/clients/${clientId}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: template.name, type: template.type }),
    });
    setAdding(false);
    setSelectedType("");
    setLoading(false);
    if (res.ok) router.refresh();
  }

  async function handleRemove(agentId: string) {
    setRemovingId(agentId);
    await fetch(`/api/admin/clients/${clientId}/agents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
    setRemovingId(null);
    router.refresh();
  }

  function handleConfigSaved(agentId: string, config: AgentConfig) {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, config } : a));
  }

  const typeIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
    onboarding: UserCheck, admin: ClipboardList, growth: TrendingUp, social: Share2,
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-text-primary">Assigned AI Agents</h2>
          {available.length > 0 && (
            <button onClick={() => setAdding(!adding)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 transition-colors">
              <Plus size={14} /> Add Agent
            </button>
          )}
        </div>

        {adding && (
          <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <p className="text-text-muted text-xs font-medium">Select agent to assign:</p>
            <div className="grid gap-2">
              {available.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.type} onClick={() => setSelectedType(t.type)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${selectedType === t.type ? "border-accent-blue/50 bg-accent-blue/10" : "border-white/[0.08] hover:bg-white/[0.04]"}`}>
                    <Icon size={16} className="text-accent-cyan mt-0.5 shrink-0" />
                    <div>
                      <p className="text-text-primary text-sm font-medium">{t.name}</p>
                      <p className="text-text-muted text-xs mt-0.5">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleAdd} disabled={!selectedType || loading}
                className="px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
                {loading ? "Assigning..." : "Assign Agent"}
              </button>
              <button onClick={() => { setAdding(false); setSelectedType(""); }}
                className="px-4 py-2 rounded-xl glass border border-white/[0.08] text-text-muted text-sm hover:bg-white/[0.08] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {agents.length === 0 ? (
          <div className="text-center py-8">
            <Bot size={24} className="text-text-muted/30 mx-auto mb-2" />
            <p className="text-text-muted text-sm">No agents assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => {
              const Icon = typeIcons[agent.type] || Bot;
              const isConfiguring = configuringId === agent.id;
              const status = liveStatus(agent.status, lastRun);
              const hasConfig = agent.config && Object.keys(agent.config).length > 0;

              return (
                <div key={agent.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center">
                        <Icon size={16} className="text-accent-cyan" />
                      </div>
                      <div>
                        <p className="text-text-primary text-sm font-medium">{agent.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.label === "Running" ? "animate-pulse" : ""}`} />
                            {status.label}
                          </span>
                          <span className="text-text-muted/30 text-xs">·</span>
                          <span className="text-text-muted/50 text-xs">v{AGENT_VERSION}</span>
                          {hasConfig && <><span className="text-text-muted/30 text-xs">·</span><span className="text-emerald-400 text-xs">Configured</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(agent.type === "onboarding" || agent.type === "social" || agent.type === "admin") && (
                        <button onClick={() => setConfiguringId(isConfiguring ? null : agent.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            isConfiguring ? "bg-accent-blue/20 border-accent-blue/30 text-accent-blue" : "bg-white/[0.04] border-white/[0.10] text-text-muted hover:text-text-primary hover:bg-white/[0.08]"
                          }`}>
                          <Settings size={12} />
                          Configure
                          {isConfiguring ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                      <button onClick={() => handleRemove(agent.id)} disabled={removingId === agent.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                        <Trash2 size={12} />
                        {removingId === agent.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                  {isConfiguring && agent.type === "onboarding" && (
                    <div className="px-4 pb-4">
                      <OnboardingConfigPanel
                        agent={agent}
                        clientId={clientId}
                        lastRun={lastRun}
                        employeesManaged={employeesManaged}
                        allClients={allClients}
                        onSaved={handleConfigSaved}
                      />
                    </div>
                  )}
                  {isConfiguring && agent.type === "social" && (
                    <div className="px-4 pb-4">
                      <SocialConfigPanel
                        agent={agent}
                        clientId={clientId}
                        lastRun={lastRun}
                        allClients={allClients}
                        onSaved={handleConfigSaved}
                      />
                    </div>
                  )}
                  {isConfiguring && agent.type === "admin" && (
                    <div className="px-4 pb-4">
                      <AdminConfigPanel
                        agent={agent}
                        clientId={clientId}
                        lastRun={lastRun}
                        allClients={allClients}
                        onSaved={handleConfigSaved}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
