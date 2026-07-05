"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Send, Trash2, ExternalLink, Mail, AlertTriangle,
  ShieldCheck, Share2, GitBranch, FileWarning, Inbox as InboxIcon, RefreshCw,
  Clock, CalendarCheck,
} from "lucide-react";
import AgentAvatar, { agentLabel } from "@/components/portal/AgentAvatar";

type Priority = "urgent" | "action" | "review" | "info";

interface WorkItem {
  id: string;
  source: "approval" | "email_draft" | "social_post" | "missing_docs" | "risk" | "compliance" | "workflow_failure" | "ticket_review" | "ticket_expiring";
  agentType: string;
  title: string;
  subtitle: string;
  priority: Priority;
  createdAt: string;
  payload: Record<string, unknown>;
}

interface ActivityLine {
  id: string;
  digitalEmployee: string;
  action: string;
  timestamp: string;
}

const PRIORITY_DOT: Record<Priority, string> = {
  urgent: "bg-red-400",
  action: "bg-amber-400",
  review: "bg-accent-cyan",
  info: "bg-text-muted/40",
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "urgent", label: "Urgent" },
  { key: "approvals", label: "Approvals" },
  { key: "drafts", label: "Drafts" },
];

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function InboxPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const [filter, setFilter] = useState("all");
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityLine[]>([]);
  const [mobileDetail, setMobileDetail] = useState(false);
  const selectedRef = useRef<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/portal/inbox");
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
        // Keep selection alive across refresh
        if (selectedRef.current) {
          const still = (d.items || []).find((i: WorkItem) => i.id === selectedRef.current);
          if (!still) {
            setSelected(null);
            selectedRef.current = null;
          }
        }
      }
    } catch { /* offline — keep current list */ }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/portal/activity")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = d?.activity || d?.items || [];
        setActivity(list.slice(0, 8));
      })
      .catch(() => {});
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [load]);

  function select(item: WorkItem) {
    setSelected(item);
    selectedRef.current = item.id;
    setMobileDetail(true);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected(null);
    selectedRef.current = null;
    setMobileDetail(false);
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function act(item: WorkItem, fn: () => Promise<Response>, successMsg: string) {
    setActing(true);
    try {
      const res = await fn();
      if (res.ok) {
        removeItem(item.id);
        flash(successMsg);
      } else {
        const d = await res.json().catch(() => ({}));
        flash(d.error || "Something went wrong — try again");
      }
    } catch {
      flash("Network error — try again");
    }
    setActing(false);
  }

  const rowId = (item: WorkItem) => String(item.payload.id ?? "");

  // ── Actions per source ──
  const approve = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/approvals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId(item), status: "approved" }),
    }), "Approved ✓");

  const reject = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/approvals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId(item), status: "rejected" }),
    }), "Rejected");

  const markEmailSent = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/admin-assist/emails", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId(item), status: "sent" }),
    }), "Marked as sent ✓");

  const deleteEmailDraft = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/admin-assist/emails", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId(item) }),
    }), "Draft deleted");

  const approvePost = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/social/posts", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId(item), status: "approved" }),
    }), "Post approved ✓");

  const rejectPost = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/social/posts", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId(item) }),
    }), "Post rejected");

  const sendDocReminder = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/inbox", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_doc_reminder", onboardingId: rowId(item) }),
    }), "Reminder email sent ✓");

  const approveDocument = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/inbox", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve_document", documentId: rowId(item) }),
    }), "Approved ✓");

  const requestReupload = (item: WorkItem) =>
    act(item, () => fetch("/api/portal/inbox", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request_reupload", documentId: rowId(item) }),
    }), "Re-upload requested ✓");

  const renewTicket = (item: WorkItem, newDate: string) =>
    act(item, () => fetch("/api/portal/inbox", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "renew_document", documentId: rowId(item), expiryDate: newDate }),
    }), "Renewed ✓");

  const renewCompliance = (item: WorkItem, newDate: string) =>
    act(item, () => fetch("/api/portal/compliance/items", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId(item), expiry_date: newDate }),
    }), "Renewed ✓");

  // ── Filtering ──
  const filtered = items.filter((i) => {
    if (filter === "urgent") return i.priority === "urgent";
    if (filter === "approvals") return i.source === "approval";
    if (filter === "drafts") return i.source === "email_draft" || i.source === "social_post";
    return true;
  });

  // ── Keyboard navigation (↑/↓ or j/k to move, Esc to deselect) ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey) return;
      if (e.key === "ArrowDown" || e.key === "j" || e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const idx = filtered.findIndex((i) => i.id === selectedRef.current);
        const next = e.key === "ArrowDown" || e.key === "j"
          ? Math.min(idx + 1, filtered.length - 1)
          : Math.max(idx - 1, 0);
        if (filtered[next]) select(filtered[next]);
      }
      if (e.key === "Escape") {
        setSelected(null);
        selectedRef.current = null;
        setMobileDetail(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  return (
    <div className="flex -m-5 lg:-m-7 h-[calc(100vh-3rem)] min-h-0">
      {/* ── List pane ── */}
      <div className={`${mobileDetail ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 lg:w-96 shrink-0 border-r border-white/[0.06] min-h-0`}>
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] shrink-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                filter === f.key
                  ? "bg-white/[0.08] text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {f.label}
              {f.key === "urgent" && items.some((i) => i.priority === "urgent") && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 ml-1.5 align-middle" />
              )}
            </button>
          ))}
          <button
            onClick={() => load()}
            className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-text-muted/60 hover:text-text-primary hover:bg-white/[0.05] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && items.length === 0 ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-2.5 animate-pulse">
                  <div className="w-7 h-7 rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                    <div className="h-2.5 bg-white/[0.04] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                <CheckCircle2 size={22} className="text-emerald-400" />
              </div>
              <p className="text-text-primary text-[13px] font-medium mb-1">All clear</p>
              <p className="text-text-muted text-[12px] leading-relaxed">
                Your AI employees are on top of everything. New work will appear here.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => select(item)}
                className={`w-full flex items-start gap-2.5 px-3.5 py-3 border-b border-white/[0.04] text-left transition-colors ${
                  selected?.id === item.id ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                }`}
              >
                <AgentAvatar type={item.agentType} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-text-primary truncate">{item.title}</p>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">{item.subtitle}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                  <span className="text-[10px] text-text-muted/60">{timeAgo(item.createdAt)}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[item.priority]}`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Detail pane ── */}
      <div className={`${mobileDetail ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0 min-h-0`}>
        {selected ? (
          <DetailPane
            item={selected}
            acting={acting}
            onBack={() => setMobileDetail(false)}
            actions={{ approve, reject, markEmailSent, deleteEmailDraft, approvePost, rejectPost, sendDocReminder, renewCompliance, approveDocument, requestReupload, renewTicket }}
          />
        ) : (
          <EmptyDetail activity={activity} itemCount={items.length} />
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass border border-white/[0.1] rounded-full px-4 py-2 text-[13px] text-text-primary shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────

function EmptyDetail({ activity, itemCount }: { activity: ActivityLine[]; itemCount: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      <div className="max-w-sm w-full">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
            <InboxIcon size={20} className="text-text-muted/60" />
          </div>
          <p className="text-text-primary text-[13px] font-medium">
            {itemCount > 0 ? "Select an item to review" : "Nothing needs you right now"}
          </p>
          <p className="text-text-muted text-[12px] mt-1">
            Decisions your AI employees need from you land here.
          </p>
        </div>

        {activity.length > 0 && (
          <div className="glass rounded-xl border border-white/[0.06] p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted/50 mb-3">
              Latest agent activity
            </p>
            <div className="space-y-2.5">
              {activity.map((a, i) => (
                <motion.div
                  key={a.id || i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/70 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-text-muted leading-snug truncate">{a.action}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────

interface Actions {
  approve: (i: WorkItem) => void;
  reject: (i: WorkItem) => void;
  markEmailSent: (i: WorkItem) => void;
  deleteEmailDraft: (i: WorkItem) => void;
  approvePost: (i: WorkItem) => void;
  rejectPost: (i: WorkItem) => void;
  sendDocReminder: (i: WorkItem) => void;
  renewCompliance: (i: WorkItem, d: string) => void;
  approveDocument: (i: WorkItem) => void;
  requestReupload: (i: WorkItem) => void;
  renewTicket: (i: WorkItem, d: string) => void;
}

function DetailPane({ item, acting, onBack, actions }: { item: WorkItem; acting: boolean; onBack: () => void; actions: Actions }) {
  const p = item.payload as Record<string, string | number | null>;
  const [renewDate, setRenewDate] = useState("");

  const header = (
    <div className="flex items-center gap-2.5 px-5 py-2.5 border-b border-white/[0.06] shrink-0">
      <button onClick={onBack} className="md:hidden text-text-muted text-[12px] mr-1">←</button>
      <AgentAvatar type={item.agentType} size={20} />
      <span className="text-[13px] font-semibold text-text-primary truncate flex-1">{item.title}</span>
      <span className="text-[11px] text-text-muted/60 shrink-0">{agentLabel(item.agentType)}</span>
    </div>
  );

  const btnPrimary = "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue-light text-white text-[13px] font-semibold transition-colors disabled:opacity-50";
  const btnGreen = "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-[13px] font-semibold transition-colors disabled:opacity-50";
  const btnRed = "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[13px] font-medium transition-colors disabled:opacity-50";
  const btnGhost = "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg glass border border-white/[0.08] hover:border-white/[0.16] text-text-muted hover:text-text-primary text-[13px] font-medium transition-colors";

  let body: React.ReactNode = null;
  let footer: React.ReactNode = null;

  switch (item.source) {
    case "email_draft":
      body = (
        <>
          <MetaRow icon={Mail} label="To" value={String(p.to_recipients || "—")} />
          <MetaRow icon={Clock} label="Type" value={String(p.email_type || "custom").replace(/_/g, " ")} />
          <div className="glass rounded-xl border border-white/[0.06] p-4 mt-4">
            <p className="text-[13px] font-semibold text-text-primary mb-2">{String(p.subject)}</p>
            <p className="text-[13px] text-text-muted leading-relaxed whitespace-pre-wrap">{String(p.body)}</p>
          </div>
        </>
      );
      footer = (
        <>
          <button disabled={acting} onClick={() => actions.markEmailSent(item)} className={btnGreen}>
            <Send size={14} /> Mark sent
          </button>
          <Link href="/portal/admin-assist/emails" className={btnGhost}>
            <ExternalLink size={13} /> Edit in Drafts
          </Link>
          <button disabled={acting} onClick={() => actions.deleteEmailDraft(item)} className={btnRed}>
            <Trash2 size={13} /> Delete
          </button>
        </>
      );
      break;

    case "social_post":
      body = (
        <>
          <MetaRow icon={Share2} label="Platform" value={String(p.platform || "—")} />
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(p.image_url)} alt="Post" className="rounded-xl border border-white/[0.08] max-h-64 object-cover mt-3" />
          ) : null}
          <div className="glass rounded-xl border border-white/[0.06] p-4 mt-4">
            <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{String(p.content)}</p>
          </div>
        </>
      );
      footer = (
        <>
          <button disabled={acting} onClick={() => actions.approvePost(item)} className={btnGreen}>
            <CheckCircle2 size={14} /> Approve
          </button>
          <button disabled={acting} onClick={() => actions.rejectPost(item)} className={btnRed}>
            <XCircle size={13} /> Reject
          </button>
          <Link href="/portal/social/posts" className={btnGhost}>
            <ExternalLink size={13} /> View all posts
          </Link>
        </>
      );
      break;

    case "approval":
      body = (
        <>
          {p.related_person || p.employee_name ? (
            <MetaRow icon={CalendarCheck} label="Regarding" value={String(p.related_person || p.employee_name)} />
          ) : null}
          <MetaRow icon={Clock} label="Requested by" value={String(p.digital_employee || p.requested_by || "AI Employee")} />
          {p.description ? (
            <div className="glass rounded-xl border border-white/[0.06] p-4 mt-4">
              <p className="text-[13px] text-text-muted leading-relaxed whitespace-pre-wrap">{String(p.description)}</p>
            </div>
          ) : null}
        </>
      );
      footer = (
        <>
          <button disabled={acting} onClick={() => actions.approve(item)} className={btnGreen}>
            <CheckCircle2 size={14} /> Approve
          </button>
          <button disabled={acting} onClick={() => actions.reject(item)} className={btnRed}>
            <XCircle size={13} /> Reject
          </button>
        </>
      );
      break;

    case "missing_docs":
      body = (
        <>
          <MetaRow icon={FileWarning} label="Role" value={String(p.role || "—")} />
          <MetaRow icon={CalendarCheck} label="Starts" value={p.start_date ? new Date(String(p.start_date)).toLocaleDateString("en-AU", { day: "numeric", month: "long" }) : "—"} />
          <MetaRow icon={Clock} label="Last chased" value={p.last_contacted ? timeAgo(String(p.last_contacted)) + " ago" : "not yet"} />
          <div className="glass rounded-xl border border-amber-500/15 p-4 mt-4">
            <p className="text-[13px] text-amber-400 font-medium mb-1">
              {String(p.missing_documents)} document{Number(p.missing_documents) !== 1 ? "s" : ""} still outstanding
            </p>
            <p className="text-[12px] text-text-muted leading-relaxed">
              AI Onboarding chases automatically every 2 days. Send a manual nudge if this is time-sensitive.
            </p>
          </div>
        </>
      );
      footer = (
        <>
          <button disabled={acting} onClick={() => actions.sendDocReminder(item)} className={btnPrimary}>
            <Send size={14} /> Send reminder now
          </button>
          <Link href={`/portal/onboarding/${p.id}`} className={btnGhost}>
            <ExternalLink size={13} /> View onboarding
          </Link>
        </>
      );
      break;

    case "risk":
      body = (
        <>
          <MetaRow icon={AlertTriangle} label="Risk level" value={String(p.risk_level)} />
          <MetaRow icon={CalendarCheck} label="Starts" value={p.start_date ? new Date(String(p.start_date)).toLocaleDateString("en-AU", { day: "numeric", month: "long" }) : "—"} />
          <MetaRow icon={FileWarning} label="Missing docs" value={String(p.missing_documents ?? 0)} />
          <div className="glass rounded-xl border border-red-500/15 p-4 mt-4">
            <p className="text-[12px] text-text-muted leading-relaxed">
              This hire may not be ready by their start date. Review their onboarding and consider contacting them or their manager directly.
            </p>
          </div>
        </>
      );
      footer = (
        <Link href={`/portal/onboarding/${p.id}`} className={btnPrimary}>
          <ExternalLink size={14} /> Review onboarding
        </Link>
      );
      break;

    case "compliance": {
      const daysLeft = Number(p.daysLeft);
      body = (
        <>
          <MetaRow icon={ShieldCheck} label="Category" value={String(p.category || "—")} />
          <MetaRow icon={CalendarCheck} label="Expiry" value={p.expiry_date ? new Date(String(p.expiry_date)).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
          {p.assigned_to ? <MetaRow icon={Clock} label="Assigned to" value={String(p.assigned_to)} /> : null}
          <div className={`glass rounded-xl border p-4 mt-4 ${daysLeft < 0 ? "border-red-500/20" : daysLeft <= 7 ? "border-red-500/15" : "border-amber-500/15"}`}>
            <p className={`text-[13px] font-medium mb-2 ${daysLeft < 0 || daysLeft <= 7 ? "text-red-400" : "text-amber-400"}`}>
              {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} ago` : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
            </p>
            <p className="text-[12px] text-text-muted leading-relaxed mb-3">
              Once renewed, set the new expiry date and this item returns to compliant.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={renewDate}
                onChange={(e) => setRenewDate(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-1.5 text-[13px] text-text-primary focus:border-accent-blue/50 focus:outline-none [color-scheme:dark]"
              />
              <button
                disabled={acting || !renewDate}
                onClick={() => actions.renewCompliance(item, renewDate)}
                className={btnGreen}
              >
                <CheckCircle2 size={14} /> Mark renewed
              </button>
            </div>
          </div>
        </>
      );
      footer = (
        <Link href="/portal/compliance" className={btnGhost}>
          <ExternalLink size={13} /> Open compliance register
        </Link>
      );
      break;
    }

    case "ticket_review":
      body = (
        <>
          <MetaRow icon={FileWarning} label="Worker" value={String(p.employeeName || "—")} />
          <MetaRow icon={Clock} label="Uploaded" value={timeAgo(String(p.received_at || p.created_at)) + " ago"} />
          <div className="glass rounded-xl border border-amber-500/15 p-4 mt-4">
            <p className="text-[13px] text-amber-400 font-medium mb-1">AI Onboarding flagged this document</p>
            <p className="text-[12px] text-text-muted leading-relaxed">
              {String(p.validation_notes || "This needs a quick manual check before it's approved.")}
            </p>
          </div>
        </>
      );
      footer = (
        <>
          {p.file_url ? (
            <a href={String(p.file_url)} target="_blank" rel="noreferrer" className={btnGhost}>
              <ExternalLink size={13} /> View document
            </a>
          ) : null}
          <button disabled={acting} onClick={() => actions.approveDocument(item)} className={btnGreen}>
            <CheckCircle2 size={14} /> Approve anyway
          </button>
          <button disabled={acting} onClick={() => actions.requestReupload(item)} className={btnRed}>
            <Send size={13} /> Request re-upload
          </button>
        </>
      );
      break;

    case "ticket_expiring": {
      const daysLeft = Number(p.daysLeft);
      body = (
        <>
          <MetaRow icon={FileWarning} label="Worker" value={String(p.employeeName || "—")} />
          <MetaRow icon={CalendarCheck} label="Expiry" value={p.expiry_date ? new Date(String(p.expiry_date)).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
          <div className={`glass rounded-xl border p-4 mt-4 ${daysLeft < 0 || daysLeft <= 7 ? "border-red-500/15" : "border-amber-500/15"}`}>
            <p className={`text-[13px] font-medium mb-2 ${daysLeft < 0 || daysLeft <= 7 ? "text-red-400" : "text-amber-400"}`}>
              {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} ago` : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
            </p>
            <p className="text-[12px] text-text-muted leading-relaxed mb-3">
              This worker isn&apos;t site-ready without a valid ticket. Request a renewal, or mark it renewed once you have the new copy.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={renewDate}
                onChange={(e) => setRenewDate(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-1.5 text-[13px] text-text-primary focus:border-accent-blue/50 focus:outline-none [color-scheme:dark]"
              />
              <button
                disabled={acting || !renewDate}
                onClick={() => actions.renewTicket(item, renewDate)}
                className={btnGreen}
              >
                <CheckCircle2 size={14} /> Mark renewed
              </button>
            </div>
          </div>
        </>
      );
      footer = (
        <button disabled={acting} onClick={() => actions.requestReupload(item)} className={btnPrimary}>
          <Send size={14} /> Request renewal from worker
        </button>
      );
      break;
    }

    case "workflow_failure":
      body = (
        <>
          <MetaRow icon={GitBranch} label="Workflow" value={String(p.workflow_name)} />
          <MetaRow icon={Clock} label="Failed" value={timeAgo(String(p.created_at)) + " ago"} />
          {p.result ? (
            <div className="glass rounded-xl border border-red-500/15 p-4 mt-4">
              <p className="text-[12px] text-text-muted font-mono leading-relaxed whitespace-pre-wrap">{String(p.result)}</p>
            </div>
          ) : null}
          <p className="text-[12px] text-text-muted mt-4">
            Axiploy monitors workflow failures and will resolve this. No action is usually required from you.
          </p>
        </>
      );
      footer = (
        <Link href="/portal/workflows" className={btnGhost}>
          <ExternalLink size={13} /> View workflow health
        </Link>
      );
      break;
  }

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col flex-1 min-h-0"
    >
      {header}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 min-h-0">
        <div className="max-w-2xl">
          <p className="text-text-muted text-[13px] leading-relaxed mb-5">{item.subtitle}.</p>
          {body}
        </div>
      </div>
      {footer && (
        <div className="flex flex-wrap items-center gap-2.5 px-5 sm:px-8 py-4 border-t border-white/[0.06] shrink-0">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[11px] text-text-muted/60 w-24 shrink-0">{label}</span>
      <Icon size={13} className="text-text-muted/50 shrink-0" />
      <span className="text-[13px] text-text-primary/90 capitalize truncate">{value}</span>
    </div>
  );
}
