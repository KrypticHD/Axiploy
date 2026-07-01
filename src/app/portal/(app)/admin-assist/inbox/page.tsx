"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Mail, AlertCircle, Clock, Info, Trash2, RefreshCw, Unlink, Folder, ChevronRight, Reply, Send, CheckCircle2, X } from "lucide-react";

interface TriagedEmail {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  receivedAt: string;
  preview: string;
  isRead: boolean;
  priority: string;
  aiLabel: string | null;
  aiAction: string | null;
}

interface FullEmail {
  id: string;
  subject: string;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  cc: { name: string; address: string }[];
  receivedAt: string;
  body: string;
  bodyType: string;
}

interface OutlookFolder {
  id: string;
  displayName: string;
  unreadItemCount: number;
  totalItemCount: number;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  urgent:    { label: "Urgent",    color: "text-red-400 bg-red-500/10 border-red-500/20",       dot: "bg-red-400",       icon: AlertCircle },
  important: { label: "Important", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400",     icon: AlertCircle },
  follow_up: { label: "Follow-up", color: "text-blue-400 bg-blue-500/10 border-blue-500/20",    dot: "bg-blue-400",      icon: Clock },
  fyi:       { label: "FYI",       color: "text-text-muted bg-white/[0.05] border-white/[0.08]", dot: "bg-text-muted/40", icon: Info },
  junk:      { label: "Junk",      color: "text-text-muted/40 bg-white/[0.03] border-white/[0.05]", dot: "bg-text-muted/20", icon: Trash2 },
};

const WELL_KNOWN: Record<string, string> = {
  inbox: "Inbox",
  sentitems: "Sent Items",
  drafts: "Drafts",
  deleteditems: "Deleted Items",
  junkemail: "Junk Email",
  archive: "Archive",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function EmailBodyFrame({ html, text }: { html?: string; text?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const content = html || `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${text || ""}</pre>`;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 1.6; color: #d1d5db; background: transparent; overflow-x: hidden; word-break: break-word; }
      a { color: #60a5fa; }
      img { max-width: 100%; height: auto; }
      blockquote { border-left: 3px solid #374151; margin: 8px 0; padding-left: 12px; color: #9ca3af; }
      table { max-width: 100%; }
    </style></head><body>${content}</body></html>`);
    doc.close();
    const resize = () => {
      if (iframe.contentDocument?.body) {
        setHeight(iframe.contentDocument.body.scrollHeight + 16);
      }
    };
    iframe.onload = resize;
    setTimeout(resize, 100);
  }, [html, text]);

  return (
    <iframe
      ref={iframeRef}
      style={{ width: "100%", height, border: "none", background: "transparent" }}
      sandbox="allow-same-origin"
      title="Email body"
    />
  );
}

export default function InboxPage() {
  const [connected, setConnected] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<OutlookFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string }>({ id: "inbox", name: "Inbox" });
  const [emails, setEmails] = useState<TriagedEmail[]>([]);
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextSkipToken, setNextSkipToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fullEmail, setFullEmail] = useState<FullEmail | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("outlook_connected") === "true") window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // When reply box opens, focus the textarea
  useEffect(() => {
    if (replyOpen && replyRef.current) {
      setTimeout(() => replyRef.current?.focus(), 50);
    }
  }, [replyOpen]);

  async function checkStatus() {
    setLoading(true);
    const res = await fetch("/api/portal/admin-assist/outlook/status");
    const data = await res.json();
    setLoading(false);
    if (data.connected) {
      setConnected({ email: data.email });
      loadFolders();
      loadEmails("inbox");
    }
  }

  async function loadFolders() {
    try {
      const res = await fetch("/api/portal/admin-assist/outlook/folders");
      const data = await res.json();
      if (data.folders) setFolders(data.folders);
    } catch {
      // well-known folders still shown
    }
  }

  async function loadEmails(folderId: string, append = false) {
    if (!append) setFetching(true);
    else setLoadingMore(true);
    const res = await fetch(`/api/portal/admin-assist/outlook/inbox?folderId=${encodeURIComponent(folderId)}`);
    const data = await res.json();
    if (!append) setFetching(false);
    else setLoadingMore(false);
    if (data.emails) {
      if (append) setEmails((prev) => [...prev, ...data.emails]);
      else setEmails(data.emails);
      setNextSkipToken(data.nextSkipToken || null);
      closeExpanded();
    }
  }

  async function loadMore() {
    if (!nextSkipToken) return;
    setLoadingMore(true);
    const res = await fetch(`/api/portal/admin-assist/outlook/inbox?folderId=${encodeURIComponent(selectedFolder.id)}&skipToken=${encodeURIComponent(nextSkipToken)}`);
    const data = await res.json();
    setLoadingMore(false);
    if (data.emails) {
      setEmails((prev) => [...prev, ...data.emails]);
      setNextSkipToken(data.nextSkipToken || null);
    }
  }

  async function openEmail(email: TriagedEmail) {
    if (expanded === email.id) {
      closeExpanded();
      return;
    }
    closeExpanded();
    setExpanded(email.id);
    setLoadingFull(true);
    // Mark as read optimistically
    setEmails((prev) => prev.map((e) => e.id === email.id ? { ...e, isRead: true } : e));
    try {
      const res = await fetch(`/api/portal/admin-assist/outlook/message?id=${encodeURIComponent(email.id)}`);
      const data = await res.json();
      setFullEmail(data);
    } catch {
      setFullEmail(null);
    }
    setLoadingFull(false);
  }

  function closeExpanded() {
    setExpanded(null);
    setFullEmail(null);
    setReplyOpen(false);
    setReplyText("");
    setSentId(null);
  }

  async function deleteEmail(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/portal/admin-assist/outlook/message?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setEmails((prev) => prev.filter((e) => e.id !== id));
      if (expanded === id) closeExpanded();
    }
  }

  async function sendReply() {
    if (!replyText.trim() || !expanded) return;
    setSending(true);
    const res = await fetch("/api/portal/admin-assist/outlook/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: expanded, comment: replyText }),
    });
    setSending(false);
    if (res.ok) {
      setSentId(expanded);
      setReplyOpen(false);
      setReplyText("");
    } else {
      const err = await res.json();
      alert("Failed to send: " + (err.error || "Unknown error"));
    }
  }

  function selectFolder(folder: OutlookFolder) {
    setSelectedFolder({ id: folder.id, name: folder.displayName });
    setEmails([]);
    setNextSkipToken(null);
    loadEmails(folder.id);
  }

  function selectWellKnown(id: string) {
    setSelectedFolder({ id, name: WELL_KNOWN[id] || id });
    setEmails([]);
    setNextSkipToken(null);
    loadEmails(id);
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Outlook from Axiploy?")) return;
    setDisconnecting(true);
    await fetch("/api/portal/admin-assist/outlook/status", { method: "DELETE" });
    setConnected(null);
    setEmails([]);
    setFolders([]);
    setDisconnecting(false);
  }

  const filtered = filter === "all" ? emails : emails.filter((e) => e.priority === filter);
  const counts = {
    urgent: emails.filter((e) => e.priority === "urgent").length,
    important: emails.filter((e) => e.priority === "important").length,
    follow_up: emails.filter((e) => e.priority === "follow_up").length,
  };
  const customFolders = folders.filter((f) => !Object.keys(WELL_KNOWN).some((k) => f.displayName.toLowerCase().replace(/\s/g, "") === k.replace(/\s/g, "")));

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-text-muted/40" /></div>;
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Inbox</h1>
          <p className="text-text-muted text-sm mt-1">Connect your Microsoft 365 account to triage emails with AI.</p>
        </div>
        <div className="glass rounded-2xl p-10 text-center border border-dashed border-white/[0.08] space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto">
            <Mail size={28} className="text-accent-blue" />
          </div>
          <div>
            <p className="text-text-primary font-semibold text-lg">Connect Microsoft Outlook</p>
            <p className="text-text-muted text-sm mt-1 max-w-sm mx-auto">AI reads your inbox, prioritises important emails, and surfaces what needs action.</p>
          </div>
          <a href="/api/portal/admin-assist/outlook/connect"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-accent-blue-light transition-colors">
            <Mail size={16} /> Connect Outlook / Microsoft 365
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Inbox</h1>
          <p className="text-text-muted text-sm mt-0.5">{connected.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadEmails(selectedFolder.id)} disabled={fetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/[0.08] text-text-muted text-sm hover:text-text-primary transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={fetching ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={handleDisconnect} disabled={disconnecting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/[0.08] text-text-muted/50 text-sm hover:text-red-400 transition-colors">
            <Unlink size={13} /> Disconnect
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Folder sidebar */}
        <div className="w-48 flex-shrink-0 glass rounded-2xl border border-white/[0.06] p-3 space-y-0.5">
          <p className="text-text-muted/50 text-[10px] font-semibold uppercase tracking-wider px-2 pb-1">Folders</p>
          {Object.entries(WELL_KNOWN).map(([id, name]) => {
            const folder = folders.find((f) => f.displayName.toLowerCase().replace(/\s/g, "") === id.replace(/\s/g, ""));
            const unread = folder?.unreadItemCount || 0;
            const isActive = selectedFolder.id === id || selectedFolder.name === name;
            return (
              <button key={id} onClick={() => selectWellKnown(id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${isActive ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"}`}>
                <span className="flex items-center gap-1.5 truncate">
                  <Mail size={11} className="flex-shrink-0" /> {name}
                </span>
                {unread > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue font-bold flex-shrink-0">{unread}</span>}
              </button>
            );
          })}
          {customFolders.length > 0 && (
            <>
              <div className="pt-2 pb-1">
                <p className="text-text-muted/50 text-[10px] font-semibold uppercase tracking-wider px-2">My Folders</p>
              </div>
              {customFolders.map((folder) => {
                const isActive = selectedFolder.id === folder.id;
                return (
                  <button key={folder.id} onClick={() => selectFolder(folder)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${isActive ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"}`}>
                    <span className="flex items-center gap-1.5 truncate">
                      <Folder size={11} className="flex-shrink-0" /> {folder.displayName}
                    </span>
                    {folder.unreadItemCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue font-bold flex-shrink-0">{folder.unreadItemCount}</span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Email list */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-1.5 text-text-muted text-sm">
            <ChevronRight size={14} />
            <span className="font-medium text-text-primary">{selectedFolder.name}</span>
            <span className="text-text-muted/50 text-xs">· {emails.length} loaded</span>
          </div>

          {emails.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {["all", "urgent", "important", "follow_up", "fyi", "junk"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary glass border border-white/[0.06]"}`}>
                  {f === "all" ? `All (${emails.length})` : f === "follow_up" ? `Follow-up${counts.follow_up > 0 ? ` (${counts.follow_up})` : ""}` : `${f.charAt(0).toUpperCase() + f.slice(1)}${f === "urgent" && counts.urgent > 0 ? ` (${counts.urgent})` : f === "important" && counts.important > 0 ? ` (${counts.important})` : ""}`}
                </button>
              ))}
            </div>
          )}

          {fetching && emails.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-accent-blue/60" />
              <p className="text-text-muted text-sm">AI is reading and triaging your emails...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-dashed border-white/[0.08]">
              <Mail size={24} className="text-text-muted/20 mx-auto mb-2" />
              <p className="text-text-muted/50 text-sm">{emails.length === 0 ? "No emails in this folder" : "No emails in this category"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((email) => {
                const cfg = PRIORITY_CONFIG[email.priority] || PRIORITY_CONFIG.fyi;
                const isOpen = expanded === email.id;
                const wasSent = sentId === email.id;
                return (
                  <div key={email.id}
                    className={`glass rounded-xl border transition-all ${email.priority === "urgent" ? "border-red-500/20" : email.priority === "important" ? "border-amber-500/20" : "border-white/[0.06]"} ${isOpen ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}>
                    {/* Email header row — click to expand */}
                    <div className="p-4 cursor-pointer group/row" onClick={() => openEmail(email)}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
                            {email.aiLabel && <span className="text-[10px] text-text-muted/60 italic">{email.aiLabel}</span>}
                            {!email.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" />}
                          </div>
                          <p className={`text-sm font-medium truncate ${email.isRead ? "text-text-muted" : "text-text-primary"}`}>{email.subject}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-text-muted/60 text-xs truncate">{email.from}</p>
                            <span className="text-text-muted/30 text-xs">·</span>
                            <p className="text-text-muted/40 text-xs flex-shrink-0">{timeAgo(email.receivedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteEmail(email.id); }}
                            disabled={deletingId === email.id}
                            title="Delete"
                            className={`p-1.5 rounded-lg transition-colors ${isOpen ? "text-text-muted/40 hover:text-red-400 hover:bg-red-500/10" : "opacity-0 group-hover/row:opacity-100 text-text-muted/40 hover:text-red-400 hover:bg-red-500/10"} disabled:opacity-30`}>
                            {deletingId === email.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                          {isOpen && (
                            <button onClick={(e) => { e.stopPropagation(); closeExpanded(); }}
                              className="p-1.5 rounded-lg text-text-muted/40 hover:text-text-muted hover:bg-white/[0.04] transition-colors">
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded email view */}
                    {isOpen && (
                      <div className="border-t border-white/[0.06]">
                        {/* Email meta */}
                        {fullEmail && (
                          <div className="px-4 py-3 bg-white/[0.02] space-y-1 text-xs text-text-muted/70 border-b border-white/[0.06]">
                            <div><span className="text-text-muted/40">From:</span> {fullEmail.from?.name} {fullEmail.from?.address && `<${fullEmail.from.address}>`}</div>
                            {fullEmail.to?.length > 0 && <div><span className="text-text-muted/40">To:</span> {fullEmail.to.map((r) => r.name || r.address).join(", ")}</div>}
                            {fullEmail.cc?.length > 0 && <div><span className="text-text-muted/40">CC:</span> {fullEmail.cc.map((r) => r.name || r.address).join(", ")}</div>}
                            <div><span className="text-text-muted/40">Date:</span> {new Date(fullEmail.receivedAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</div>
                          </div>
                        )}

                        {/* Email body */}
                        <div className="px-4 py-4">
                          {loadingFull ? (
                            <div className="flex items-center gap-2 py-4 text-text-muted/60">
                              <Loader2 size={14} className="animate-spin" /> <span className="text-sm">Loading email...</span>
                            </div>
                          ) : fullEmail ? (
                            <EmailBodyFrame
                              html={fullEmail.bodyType === "html" ? fullEmail.body : undefined}
                              text={fullEmail.bodyType !== "html" ? fullEmail.body : undefined}
                            />
                          ) : (
                            <p className="text-text-muted text-sm leading-relaxed">{email.preview}</p>
                          )}
                        </div>

                        {/* AI suggestion */}
                        {email.aiAction && (
                          <div className="mx-4 mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-accent-blue/5 border border-accent-blue/15">
                            <span className="text-accent-blue text-xs font-semibold">AI suggests:</span>
                            <span className="text-text-muted text-xs">{email.aiAction}</span>
                          </div>
                        )}

                        {/* Sent confirmation */}
                        {wasSent && !replyOpen && (
                          <div className="mx-4 mb-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                            <CheckCircle2 size={15} /> Reply sent successfully
                          </div>
                        )}

                        {/* Reply compose box */}
                        {replyOpen ? (
                          <div className="mx-4 mb-4 rounded-xl border border-accent-blue/20 bg-white/[0.02] overflow-hidden">
                            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                              <span className="text-xs text-text-muted/70">
                                Reply to <span className="text-text-muted">{fullEmail?.from?.name || email.from}</span>
                              </span>
                              <button onClick={() => { setReplyOpen(false); setReplyText(""); }}
                                className="text-text-muted/40 hover:text-text-muted transition-colors">
                                <X size={12} />
                              </button>
                            </div>
                            <textarea
                              ref={replyRef}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply..."
                              rows={6}
                              className="w-full px-3 py-3 bg-transparent text-text-primary text-sm resize-none outline-none placeholder:text-text-muted/30"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
                              }}
                            />
                            <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between">
                              <span className="text-text-muted/30 text-[11px]">⌘ Enter to send</span>
                              <button
                                onClick={sendReply}
                                disabled={sending || !replyText.trim()}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent-blue text-white text-xs font-semibold hover:bg-accent-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {sending ? <><Loader2 size={12} className="animate-spin" /> Sending...</> : <><Send size={12} /> Send Reply</>}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 pb-4 flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setReplyOpen(true); setSentId(null); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors">
                              <Reply size={12} /> Reply
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {nextSkipToken && filter === "all" && (
                <div className="pt-2 text-center">
                  <button onClick={loadMore} disabled={loadingMore}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-white/[0.08] text-text-muted text-sm hover:text-text-primary hover:border-white/[0.16] transition-colors disabled:opacity-50 mx-auto">
                    {loadingMore ? <><Loader2 size={14} className="animate-spin" /> Loading...</> : `Load more (${emails.length} loaded so far)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
