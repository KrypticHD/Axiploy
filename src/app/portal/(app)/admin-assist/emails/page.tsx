"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Check, Trash2, Loader2, Mail, Send, Link } from "lucide-react";

interface EmailDraft {
  id: string;
  subject: string;
  body: string;
  to_recipients?: string;
  email_type: string;
  status: "draft" | "sent" | "archived";
  created_at: string;
}

const EMAIL_TYPES = [
  { value: "follow_up", label: "Follow-up" },
  { value: "meeting_request", label: "Meeting Request" },
  { value: "thank_you", label: "Thank You" },
  { value: "reminder", label: "Reminder" },
  { value: "report_summary", label: "Report Summary" },
  { value: "custom", label: "Custom" },
];

const TONES = ["Professional", "Friendly", "Concise", "Formal", "Casual"];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function EmailsPage() {
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState<string | null>(null);
  const [form, setForm] = useState({ emailType: "follow_up", toRecipients: "", context: "", tone: "Professional" });

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/admin-assist/emails").then((r) => r.json()),
      fetch("/api/portal/admin-assist/outlook/status").then((r) => r.json()),
    ]).then(([emailData, outlookData]) => {
      setDrafts(emailData.drafts || []);
      if (outlookData.connected) {
        setOutlookConnected(true);
        setOutlookEmail(outlookData.email);
      }
    }).finally(() => setLoading(false));

    // Handle redirect from OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("outlook_connected") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("outlook_error") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
      alert("Failed to connect Outlook. Please try again.");
    }
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/portal/admin-assist/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setGenerating(false);
    if (data.draft) {
      setDrafts((prev) => [data.draft, ...prev]);
      setForm((f) => ({ ...f, context: "", toRecipients: "" }));
    }
  }

  async function handleCopy(draft: EmailDraft) {
    const text = `To: ${draft.to_recipients || ""}\nSubject: ${draft.subject}\n\n${draft.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(draft.id);
    setTimeout(() => setCopied(null), 2000);
    await fetch("/api/portal/admin-assist/emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: draft.id, status: "sent" }),
    });
    setDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, status: "sent" } : d));
  }

  async function handleSendViaOutlook(draft: EmailDraft) {
    if (!draft.to_recipients?.trim()) {
      alert("Please add a recipient (To field) before sending.");
      return;
    }
    setSending(draft.id);
    const res = await fetch("/api/portal/admin-assist/outlook/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId: draft.id,
        to: draft.to_recipients,
        subject: draft.subject,
        body: draft.body,
      }),
    });
    setSending(null);
    if (res.ok) {
      setDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, status: "sent" } : d));
    } else {
      const err = await res.json();
      alert(`Send failed: ${err.error}`);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    await fetch("/api/portal/admin-assist/emails", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Email Drafts</h1>
          <p className="text-text-muted text-sm mt-1">
            {outlookConnected
              ? `Connected to ${outlookEmail} — send directly from Axiploy`
              : "AI drafts your emails. Connect Outlook to send directly."}
          </p>
        </div>
        {outlookConnected ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-emerald-500/20 bg-emerald-500/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">Outlook Connected</span>
          </div>
        ) : (
          <a href="/api/portal/admin-assist/outlook/connect"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 transition-colors">
            <Link size={14} /> Connect Outlook
          </a>
        )}
      </div>

      {/* Generator */}
      <div className="glass rounded-2xl p-5 border border-accent-blue/15 space-y-4">
        <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Sparkles size={14} className="text-accent-blue" /> Generate Email Draft
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-text-muted text-xs mb-1 block">Email type</label>
            <select value={form.emailType} onChange={(e) => setForm((f) => ({ ...f, emailType: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40">
              {EMAIL_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-[#1c1c2e] text-white">{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Tone</label>
            <select value={form.tone} onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40">
              {TONES.map((t) => <option key={t} value={t} className="bg-[#1c1c2e] text-white">{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-text-muted text-xs mb-1 block">To (required to send via Outlook)</label>
          <input value={form.toRecipients} onChange={(e) => setForm((f) => ({ ...f, toRecipients: e.target.value }))}
            placeholder="recipient@example.com"
            className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
        </div>
        <div>
          <label className="text-text-muted text-xs mb-1 block">Context</label>
          <textarea value={form.context} onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
            placeholder="What is this email about? e.g. Following up on the proposal we sent last week to ABC Corp..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.10] rounded-xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40 resize-none" />
        </div>
        <button onClick={handleGenerate} disabled={generating || !form.context.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? "Writing your email..." : "Generate Draft"}
        </button>
      </div>

      {/* Drafts list */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-text-muted/40" /></div>
      ) : drafts.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-dashed border-white/[0.08]">
          <Mail size={24} className="text-text-muted/20 mx-auto mb-2" />
          <p className="text-text-muted/50 text-sm">No email drafts yet — generate one above</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Generated Drafts</p>
          {drafts.map((draft) => (
            <div key={draft.id} className="glass rounded-2xl border border-white/[0.06]">
              <div className="flex items-start justify-between p-4 pb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-text-muted/60 capitalize">
                      {EMAIL_TYPES.find((t) => t.value === draft.email_type)?.label || draft.email_type}
                    </span>
                    {draft.status === "sent" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Sent</span>}
                    <span className="text-text-muted/40 text-[10px]">{timeAgo(draft.created_at)}</span>
                  </div>
                  {draft.to_recipients && <p className="text-text-muted text-xs mb-1">To: {draft.to_recipients}</p>}
                  <p className="text-text-primary text-sm font-medium">{draft.subject}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                  {outlookConnected && draft.status !== "sent" && (
                    <button onClick={() => handleSendViaOutlook(draft)} disabled={sending === draft.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                      {sending === draft.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      {sending === draft.id ? "Sending..." : "Send via Outlook"}
                    </button>
                  )}
                  {draft.status !== "sent" && (
                    <button onClick={() => handleCopy(draft)} disabled={actionLoading === draft.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors">
                      {copied === draft.id ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  )}
                  <button onClick={() => handleDelete(draft.id)} disabled={actionLoading === draft.id}
                    className="p-1.5 rounded-lg text-text-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">{draft.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
