"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, AlertCircle, Clock, Info, Trash2, RefreshCw, Unlink, Folder, ChevronRight } from "lucide-react";

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
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("outlook_connected") === "true") window.history.replaceState({}, "", window.location.pathname);
  }, []);

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
    const res = await fetch("/api/portal/admin-assist/outlook/folders");
    const data = await res.json();
    if (data.folders) setFolders(data.folders);
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
      setExpanded(null);
      setFilter("all");
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

  // Separate well-known folders from custom folders
  const wellKnownIds = new Set(["inbox", "sentitems", "drafts", "deleteditems", "junkemail", "archive"]);
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

          {/* Well-known folders */}
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

          {/* Custom folders */}
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
          {/* Current folder + priority summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-text-muted text-sm">
              <ChevronRight size={14} />
              <span className="font-medium text-text-primary">{selectedFolder.name}</span>
              <span className="text-text-muted/50 text-xs">· {emails.length} loaded</span>
            </div>
          </div>

          {/* Priority filter tabs */}
          {emails.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {["all", "urgent", "important", "follow_up", "fyi", "junk"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary glass border border-white/[0.06]"}`}>
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
                return (
                  <div key={email.id}
                    className={`glass rounded-xl border transition-all cursor-pointer ${email.priority === "urgent" ? "border-red-500/20" : email.priority === "important" ? "border-amber-500/20" : "border-white/[0.06]"} ${isOpen ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}
                    onClick={() => setExpanded(isOpen ? null : email.id)}>
                    <div className="p-4">
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
                      </div>
                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3">
                          <p className="text-text-muted text-sm leading-relaxed">{email.preview}</p>
                          {email.aiAction && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent-blue/5 border border-accent-blue/15">
                              <span className="text-accent-blue text-xs font-semibold">AI suggests:</span>
                              <span className="text-text-muted text-xs">{email.aiAction}</span>
                            </div>
                          )}
                          <a href={`mailto:${email.fromEmail}?subject=Re: ${encodeURIComponent(email.subject)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors"
                            onClick={(e) => e.stopPropagation()}>
                            <Mail size={11} /> Reply in Outlook
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load more */}
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
