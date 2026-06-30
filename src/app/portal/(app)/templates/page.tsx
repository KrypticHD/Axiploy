"use client";

import { useState, useEffect } from "react";
import { Mail, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface Template {
  template_type: string;
  subject: string;
  body: string;
  updated_at?: string;
}

const LABELS: Record<string, string> = {
  welcome: "Welcome Email",
  reminder: "Document Reminder",
  escalation: "Manager Escalation",
  completion: "Onboarding Complete",
  weekly: "Weekly Summary Report",
};

const VARIABLES: Record<string, string[]> = {
  welcome: ["{{employee_name}}", "{{company_name}}", "{{start_date}}", "{{document_deadline}}", "{{document_list}}", "{{manager_name}}", "{{manager_email}}"],
  reminder: ["{{employee_name}}", "{{start_date}}", "{{missing_document_list}}", "{{manager_name}}", "{{company_name}}"],
  escalation: ["{{manager_name}}", "{{employee_name}}", "{{start_date}}", "{{risk_reasons}}", "{{missing_documents}}"],
  completion: ["{{manager_name}}", "{{employee_name}}", "{{start_date}}"],
  weekly: ["{{client_name}}", "{{week_start}}", "{{week_end}}", "{{tasks_completed}}", "{{hours_saved}}", "{{new_onboardings}}", "{{pending_approvals}}", "{{high_risk_count}}", "{{highlights}}"],
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<string>("welcome");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portal/templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.templates || []);
        const first = (d.templates || [])[0];
        if (first) { setSelected(first.template_type); setSubject(first.subject); setBody(first.body); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function selectTemplate(type: string) {
    const t = templates.find((t) => t.template_type === type);
    if (!t) return;
    setSelected(type);
    setSubject(t.subject);
    setBody(t.body);
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/portal/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_type: selected, subject, body }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Save failed"); return; }
      setTemplates((prev) => prev.map((t) => t.template_type === selected ? { ...t, subject, body, updated_at: new Date().toISOString() } : t));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const vars = VARIABLES[selected] || [];

  if (loading) return <div className="py-10 text-center text-text-muted text-sm">Loading templates…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Email Templates</h1>
        <p className="text-text-muted text-sm mt-1">Customise the emails sent by your AI workforce to employees and managers.</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <div className="space-y-1">
          {templates.map((t) => (
            <button
              key={t.template_type}
              onClick={() => selectTemplate(t.template_type)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                selected === t.template_type
                  ? "bg-accent-blue/10 border border-accent-blue/20 text-accent-blue"
                  : "text-text-muted hover:bg-white/[0.03] hover:text-text-primary border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mail size={14} />
                <span className="text-sm font-medium">{LABELS[t.template_type] || t.template_type}</span>
              </div>
              {t.updated_at && (
                <p className="text-[10px] text-text-muted/50 mt-0.5 pl-[22px]">
                  Saved {new Date(t.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="glass rounded-2xl border border-white/[0.08] p-6 space-y-4">
          <div>
            <label className="text-text-muted text-xs font-medium block mb-1.5">Subject Line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary focus:outline-none focus:border-accent-blue/40"
            />
          </div>

          <div>
            <label className="text-text-muted text-xs font-medium block mb-1.5">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary font-mono focus:outline-none focus:border-accent-blue/40 resize-none leading-relaxed"
            />
          </div>

          {vars.length > 0 && (
            <div>
              <p className="text-text-muted text-xs font-medium mb-2">Available variables</p>
              <div className="flex flex-wrap gap-2">
                {vars.map((v) => (
                  <span key={v} className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-accent-cyan">{v}</span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/20 text-accent-blue text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save Template"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                <CheckCircle2 size={14} /> Saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
