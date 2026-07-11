"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Bot, UserCheck, BarChart2, Activity, Settings,
  BookOpen, Mail, GitBranch, LifeBuoy, Inbox, Shield, Sparkles,
  Search, MessageSquare, FilePlus, Calendar, ListTodo, CheckSquare, ShieldCheck, ShieldAlert, Users,
  CalendarDays, FolderKanban, Truck, MapPin, ClipboardList, FileText,
} from "lucide-react";

interface Command {
  label: string;
  href?: string;
  icon: React.ElementType;
  keywords?: string;
  action?: () => void;
}

interface SearchResult {
  id: string;
  type: "worker" | "site" | "project" | "requirement" | "document";
  title: string;
  subtitle: string;
  href: string;
}

const RESULT_ICON: Record<SearchResult["type"], React.ElementType> = {
  worker: Users, site: MapPin, project: FolderKanban, requirement: ClipboardList, document: FileText,
};

const RESULT_LABEL: Record<SearchResult["type"], string> = {
  worker: "Worker", site: "Site", project: "Project", requirement: "Requirement", document: "Document",
};

export default function CommandPalette({ onAsk }: { onAsk: (query?: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [dataResults, setDataResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { label: "Inbox", href: "/portal/inbox", icon: Inbox, keywords: "work items decisions" },
    { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard, keywords: "today overview" },
    { label: "AI Employees", href: "/portal/workforce", icon: Bot, keywords: "agents workforce" },
    { label: "Staff Directory", href: "/portal/staff", icon: Users, keywords: "employees workers people" },
    { label: "Onboarding", href: "/portal/onboarding", icon: UserCheck },
    { label: "Site Readiness", href: "/portal/site-readiness", icon: ShieldCheck, keywords: "tickets roster mining site ready" },
    { label: "New Employee", href: "/portal/forms/new-employee", icon: FilePlus, keywords: "add hire" },
    { label: "Approvals", href: "/portal/approvals", icon: CheckSquare },
    { label: "Daily Briefing", href: "/portal/admin-assist", icon: ListTodo, keywords: "admin assist" },
    { label: "Tasks", href: "/portal/admin-assist/tasks", icon: ListTodo },
    { label: "Meetings", href: "/portal/admin-assist/meetings", icon: Calendar },
    { label: "Email Inbox", href: "/portal/admin-assist/inbox", icon: Mail, keywords: "outlook" },
    { label: "Email Drafts", href: "/portal/admin-assist/emails", icon: Mail },
    { label: "Post Studio", href: "/portal/social", icon: Sparkles, keywords: "social media" },
    { label: "Scheduled Posts", href: "/portal/social/posts", icon: Calendar, keywords: "social" },
    { label: "Compliance Register", href: "/portal/compliance", icon: Shield, keywords: "licences insurance expiry" },
    { label: "Safety Register", href: "/portal/safety", icon: ShieldAlert, keywords: "incidents near miss corrective actions" },
    { label: "Scheduler Timeline", href: "/portal/scheduler", icon: CalendarDays, keywords: "gantt schedule roster" },
    { label: "Projects", href: "/portal/scheduler/projects", icon: FolderKanban, keywords: "jobs scheduler" },
    { label: "Equipment", href: "/portal/scheduler/equipment", icon: Truck, keywords: "plant machinery scheduler" },
    { label: "Workflow Health", href: "/portal/workflows", icon: GitBranch },
    { label: "Reports", href: "/portal/reports", icon: BarChart2 },
    { label: "Activity", href: "/portal/activity", icon: Activity, keywords: "log history" },
    { label: "Knowledge Base", href: "/portal/knowledge", icon: BookOpen, keywords: "documents" },
    { label: "Email Templates", href: "/portal/templates", icon: Mail },
    { label: "Support", href: "/portal/support", icon: LifeBuoy, keywords: "help" },
    { label: "Settings", href: "/portal/settings", icon: Settings, keywords: "profile password" },
  ];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? commands.filter((c) => c.label.toLowerCase().includes(q) || (c.keywords || "").includes(q))
    : commands.slice(0, 8);

  // Debounced live search across workers/sites/projects/requirements/documents
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      const t = setTimeout(() => { setDataResults([]); setSearching(false); }, 0);
      return () => clearTimeout(t);
    }
    const startTimer = setTimeout(() => setSearching(true), 0);
    const t = setTimeout(() => {
      fetch(`/api/portal/search?q=${encodeURIComponent(term)}`)
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((d) => setDataResults(d.results || []))
        .finally(() => setSearching(false));
    }, 250);
    return () => { clearTimeout(startTimer); clearTimeout(t); };
  }, [query]);

  const resultRows: Command[] = dataResults.map((r) => ({
    label: r.title,
    href: r.href,
    icon: RESULT_ICON[r.type],
    keywords: `${RESULT_LABEL[r.type]} ${r.subtitle}`.toLowerCase(),
  }));

  // Always offer "Ask Axiploy" — with the query when typed
  const askRow: Command = {
    label: q ? `Ask Axiploy: "${query.trim()}"` : "Ask Axiploy",
    icon: MessageSquare,
    action: () => onAsk(q ? query.trim() : undefined),
  };
  const rows = q ? [...resultRows, ...filtered, askRow] : [...filtered, askRow];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setIndex(0);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  function run(cmd: Command) {
    setOpen(false);
    if (cmd.action) cmd.action();
    else if (cmd.href) router.push(cmd.href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[18vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg glass rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/50 overflow-hidden bg-surface/95">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
          <Search size={15} className="text-text-muted/60 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, rows.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && rows[index]) run(rows[index]);
            }}
            placeholder="Go to page or ask Axiploy…"
            className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted/50 focus:outline-none"
          />
          <kbd className="text-[10px] text-text-muted/50 border border-white/[0.1] rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1.5">
          {q && searching && (
            <p className="px-4 py-1.5 text-[11px] text-text-muted/50">Searching…</p>
          )}
          {q && !searching && resultRows.length === 0 && filtered.length === 0 && (
            <p className="px-4 py-2 text-[12px] text-text-muted/70">No matches for &quot;{query.trim()}&quot;.</p>
          )}
          {rows.map((cmd, i) => (
            <button
              key={`${cmd.label}-${i}`}
              onClick={() => run(cmd)}
              onMouseEnter={() => setIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left text-[13px] transition-colors ${
                i === index ? "bg-white/[0.06] text-text-primary" : "text-text-muted"
              } ${cmd.action ? "border-t border-white/[0.05] mt-1 pt-2.5 text-accent-blue" : ""}`}
            >
              <cmd.icon size={14} className={cmd.action ? "text-accent-blue" : i === index ? "text-accent-blue" : "text-text-muted/60"} />
              <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
              {cmd.keywords && i < resultRows.length && (
                <span className="text-[10px] text-text-muted/40 shrink-0 capitalize">{cmd.keywords.split(" ")[0]}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
