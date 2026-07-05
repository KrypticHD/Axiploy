"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Bot, UserCheck, CheckSquare,
  BarChart2, Activity, FilePlus, Settings, X, MessageSquare,
  BookOpen, Mail, GitBranch, LifeBuoy, ChevronDown, ChevronRight, FolderOpen,
  Sparkles, Calendar, Share2, ClipboardList, ListTodo, Inbox, FileText, LayoutGrid, Shield,
  ShieldCheck, ShieldAlert, Users,
} from "lucide-react";
import AgentAvatar from "./AgentAvatar";

const mainNavItems = [
  { href: "/portal/inbox", label: "Inbox", icon: Inbox, badge: true },
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/workforce", label: "AI Employees", icon: Bot },
  { href: "/portal/workflows", label: "Workflow Health", icon: GitBranch },
  { href: "/portal/reports", label: "Reports", icon: BarChart2 },
  { href: "/portal/activity", label: "Activity", icon: Activity },
  { href: "/portal/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/portal/templates", label: "Email Templates", icon: Mail },
  { href: "/portal/support", label: "Support", icon: LifeBuoy },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

const onboardingNavItems = [
  { href: "/portal/staff", label: "Staff Directory", icon: Users },
  { href: "/portal/onboarding", label: "Onboarding", icon: UserCheck },
  { href: "/portal/site-readiness", label: "Site Readiness", icon: ShieldCheck },
  { href: "/portal/forms/new-employee", label: "New Employee", icon: FilePlus },
  { href: "/portal/approvals", label: "Approvals", icon: CheckSquare },
];

const ONBOARDING_PATHS = ["/portal/staff", "/portal/onboarding", "/portal/site-readiness", "/portal/forms/new-employee", "/portal/approvals"];

const socialNavItems = [
  { href: "/portal/social", label: "Post Studio", icon: Sparkles },
  { href: "/portal/social/posts", label: "Scheduled Posts", icon: Calendar },
  { href: "/portal/social/analytics", label: "Analytics", icon: BarChart2 },
];

const SOCIAL_PATHS = ["/portal/social"];

const adminNavItems = [
  { href: "/portal/admin-assist", label: "Daily Briefing", icon: LayoutGrid },
  { href: "/portal/admin-assist/tasks", label: "Tasks", icon: ListTodo },
  { href: "/portal/admin-assist/meetings", label: "Meetings", icon: Calendar },
  { href: "/portal/admin-assist/inbox", label: "Email Inbox", icon: Mail },
  { href: "/portal/admin-assist/emails", label: "Email Drafts", icon: FileText },
  { href: "/portal/admin-assist/reports", label: "Reports", icon: BarChart2 },
];

const ADMIN_ASSIST_PATHS = ["/portal/admin-assist"];

const complianceNavItems = [
  { href: "/portal/compliance", label: "Compliance Register", icon: Shield },
];

const COMPLIANCE_PATHS = ["/portal/compliance"];

const safetyNavItems = [
  { href: "/portal/safety", label: "Safety Register", icon: ShieldAlert },
];

const SAFETY_PATHS = ["/portal/safety"];

interface Agent {
  type: string;
  name: string;
  status: string;
  working: boolean;
}

interface PortalSidebarProps {
  open: boolean;
  onClose: () => void;
  onAskToggle: () => void;
}

export default function PortalSidebar({ open, onClose, onAskToggle }: PortalSidebarProps) {
  const pathname = usePathname();
  const [inboxCount, setInboxCount] = useState(0);
  const [hasOnboarding, setHasOnboarding] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [hasSocial, setHasSocial] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [hasCompliance, setHasCompliance] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [hasSafety, setHasSafety] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (ONBOARDING_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      setOnboardingOpen(true);
    }
    if (SOCIAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      setSocialOpen(true);
    }
    if (ADMIN_ASSIST_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      setAdminOpen(true);
    }
    if (COMPLIANCE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      setComplianceOpen(true);
    }
    if (SAFETY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      setSafetyOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    fetch("/api/portal/inbox?count=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.total === "number") setInboxCount(d.total); })
      .catch(() => {});

    fetch("/api/portal/packages")
      .then((r) => r.json())
      .then((d) => {
        setHasOnboarding(!!d.onboarding);
        setHasSocial(!!d.social);
        setHasAdmin(!!d.admin);
        setHasCompliance(!!d.compliance);
        setHasSafety(!!d.safety);
        setAgents(d.agents || []);
      })
      .catch(() => {});
  }, [pathname]);

  function renderNavItem(
    item: { href: string; label: string; icon: React.ElementType; badge?: boolean },
    indented = false
  ) {
    const active = pathname === item.href || (item.href !== "/portal/inbox" && pathname.startsWith(item.href + "/"));
    const badgeCount = item.badge ? inboxCount : 0;

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onClose}
          className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-150 ${indented ? "pl-5" : ""} ${
            active
              ? "bg-white/[0.06] text-text-primary"
              : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
          }`}
        >
          <item.icon size={14} className={active ? "text-accent-blue" : "text-text-muted/70"} />
          <span className="flex-1">{item.label}</span>
          {badgeCount > 0 && (
            <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/15 rounded-full px-1.5 py-px min-w-[18px] text-center">
              {badgeCount}
            </span>
          )}
        </Link>
      </li>
    );
  }

  function renderGroup(
    label: string,
    icon: React.ElementType,
    isOpen: boolean,
    setOpen: (fn: (v: boolean) => boolean) => void,
    groupActive: boolean,
    items: { href: string; label: string; icon: React.ElementType }[]
  ) {
    const Icon = icon;
    return (
      <li>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-150 ${
            groupActive ? "text-text-primary" : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
          }`}
        >
          <Icon size={14} className={groupActive ? "text-accent-blue" : "text-text-muted/70"} />
          <span className="flex-1 text-left">{label}</span>
          {isOpen ? <ChevronDown size={13} className="text-text-muted/50" /> : <ChevronRight size={13} className="text-text-muted/50" />}
        </button>
        {isOpen && (
          <ul className="mt-0.5 space-y-px border-l border-white/[0.06] ml-4">
            {items.map((item) => renderNavItem(item, true))}
          </ul>
        )}
      </li>
    );
  }

  const onboardingActive = ONBOARDING_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const socialActive = SOCIAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const adminActive = ADMIN_ASSIST_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const complianceActive = COMPLIANCE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const safetyActive = SAFETY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <div className="overflow-hidden h-9 flex items-center">
          <Image src="/logo.png" alt="Axiploy" width={400} height={120} className="h-40 w-auto object-contain scale-[1.1] origin-left" />
        </div>
        <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text-primary">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
        {/* Ask Axiploy — pinned */}
        <button
          onClick={() => { onClose(); onAskToggle(); }}
          className="w-full flex items-center gap-2.5 px-2.5 py-[7px] mb-2 rounded-lg text-[13px] font-medium text-accent-blue border border-accent-blue/15 bg-accent-blue/[0.06] hover:bg-accent-blue/[0.12] transition-colors duration-150"
        >
          <MessageSquare size={14} />
          <span className="flex-1 text-left">Ask Axiploy</span>
          <Sparkles size={12} className="text-accent-cyan/70" />
        </button>

        <ul className="space-y-px">
          {mainNavItems.slice(0, 2).map((item) => renderNavItem(item))}

          <div className="my-2 border-t border-white/[0.05]" />

          {/* Agent workspaces */}
          {hasAdmin && renderGroup("AI Admin", ClipboardList, adminOpen, setAdminOpen, adminActive, adminNavItems)}
          {hasOnboarding && renderGroup("AI Onboarding", FolderOpen, onboardingOpen, setOnboardingOpen, onboardingActive, onboardingNavItems)}
          {hasSocial && renderGroup("AI Social", Share2, socialOpen, setSocialOpen, socialActive, socialNavItems)}
          {hasCompliance && renderGroup("AI Compliance", Shield, complianceOpen, setComplianceOpen, complianceActive, complianceNavItems)}
          {hasSafety && renderGroup("AI Safety", ShieldAlert, safetyOpen, setSafetyOpen, safetyActive, safetyNavItems)}

          <div className="my-2 border-t border-white/[0.05]" />

          {mainNavItems.slice(2).map((item) => renderNavItem(item))}
        </ul>
      </nav>

      {/* AI employee roster */}
      {agents.length > 0 && (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted/40 mb-2">
            AI Employees
          </p>
          <div className="space-y-1.5">
            {agents.map((a) => (
              <Link key={a.type} href="/portal/workforce" onClick={onClose} className="flex items-center gap-2 group">
                <AgentAvatar type={a.type} size={18} working={a.working} />
                <span className="text-[11px] text-text-muted group-hover:text-text-primary transition-colors truncate">
                  {a.name}
                </span>
                {a.working ? (
                  <span className="text-[9px] text-emerald-400 ml-auto shrink-0">working</span>
                ) : a.status !== "Active" ? (
                  <span className="text-[9px] text-text-muted/40 ml-auto shrink-0">{a.status.toLowerCase()}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-surface border-r border-white/[0.06] h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-white/[0.06] z-50 lg:hidden flex flex-col">
            {content}
          </aside>
        </>
      )}
    </>
  );
}
