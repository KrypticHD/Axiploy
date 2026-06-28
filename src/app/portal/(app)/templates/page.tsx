"use client";

import { useState } from "react";
import { Mail, Save, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  body: string;
}

const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    trigger: "Sent automatically when a new employee is added",
    subject: "Welcome to {{company_name}} — Your onboarding journey starts here",
    body: `Dear {{employee_name}},

We're delighted to welcome you to {{company_name}}. Your start date is confirmed as {{start_date}}.

To complete your onboarding, please provide the following documents by {{document_deadline}}:

{{document_list}}

If you have any questions, please don't hesitate to get in touch with {{manager_name}} at {{manager_email}}.

We look forward to having you on the team.

Kind regards,
{{company_name}} HR Team`,
  },
  {
    id: "reminder",
    name: "Document Reminder",
    trigger: "Sent when documents are overdue by 3 or more days",
    subject: "Reminder: Outstanding documents required — {{employee_name}}",
    body: `Dear {{employee_name}},

We noticed that the following documents are still outstanding for your upcoming start date of {{start_date}}:

{{missing_document_list}}

Please submit these as soon as possible to avoid any delays to your onboarding. If you have already sent them, please disregard this message.

If you need assistance, please contact {{manager_name}}.

Kind regards,
{{company_name}} AI Onboarding Assistant`,
  },
  {
    id: "escalation",
    name: "Manager Escalation",
    trigger: "Sent to the line manager when an employee is flagged as high risk",
    subject: "Action Required: High-risk onboarding case — {{employee_name}}",
    body: `Dear {{manager_name}},

This is an automated alert from the Axiploy AI Onboarding Assistant.

{{employee_name}} (starting {{start_date}}) has been flagged as HIGH RISK due to the following:

{{risk_reasons}}

We recommend contacting {{employee_name}} directly as soon as possible. Outstanding items: {{missing_documents}}.

This case has been escalated for your attention.

Regards,
Axiploy AI Onboarding Assistant`,
  },
  {
    id: "completion",
    name: "Onboarding Complete",
    trigger: "Sent when all documents are received and the employee is ready to start",
    subject: "Onboarding complete — {{employee_name}} is ready to start",
    body: `Dear {{manager_name}},

Great news — {{employee_name}} has completed all onboarding requirements and is ready to start on {{start_date}}.

All required documents have been received and verified. No further action is required.

A summary report has been generated and is available in your Axiploy portal.

Kind regards,
Axiploy AI Onboarding Assistant`,
  },
  {
    id: "weekly",
    name: "Weekly Summary Report",
    trigger: "Sent every Monday morning to the client admin",
    subject: "Your AI Workforce Weekly Summary — w/c {{week_start}}",
    body: `Dear {{client_name}},

Here is your AI workforce summary for the week ending {{week_end}}:

• Tasks completed: {{tasks_completed}}
• Hours saved: {{hours_saved}}
• New employees onboarded: {{new_onboardings}}
• Pending approvals: {{pending_approvals}}
• High-risk cases: {{high_risk_count}}

{{highlights}}

View your full report in the Axiploy portal.

Regards,
Axiploy AI Admin Assistant`,
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [expanded, setExpanded] = useState<string | null>("welcome");
  const [saved, setSaved] = useState<string | null>(null);

  function handleSave(id: string) {
    setSaved(id);
    setTimeout(() => setSaved(null), 2500);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Email Template Manager</h1>
        <p className="text-text-muted text-sm mt-1">
          Customise the emails your Digital Employees send on your behalf. Variables in <code className="text-accent-cyan bg-accent-cyan/10 px-1 rounded">{"{{curly_braces}}"}</code> are filled automatically.
        </p>
      </div>

      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
            <div
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setExpanded(expanded === t.id ? null : t.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                  <Mail size={15} className="text-accent-blue" />
                </div>
                <div>
                  <p className="text-text-primary font-medium text-sm">{t.name}</p>
                  <p className="text-text-muted text-xs mt-0.5">{t.trigger}</p>
                </div>
              </div>
              {expanded === t.id ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
            </div>

            {expanded === t.id && (
              <div className="border-t border-white/[0.06] p-5 space-y-4">
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">Subject Line</label>
                  <input
                    type="text"
                    value={t.subject}
                    onChange={(e) => setTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, subject: e.target.value } : x))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-blue/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">Email Body</label>
                  <textarea
                    rows={12}
                    value={t.body}
                    onChange={(e) => setTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, body: e.target.value } : x))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-blue/50 transition-all resize-none font-mono"
                  />
                </div>
                <button
                  onClick={() => handleSave(t.id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors"
                >
                  {saved === t.id ? <><CheckCircle2 size={14} /> Saved</> : <><Save size={14} /> Save Template</>}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
