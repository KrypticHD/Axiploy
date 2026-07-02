"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Bot, UserCheck, CheckSquare,
  BarChart2, Activity, FilePlus, Settings, X, MessageSquare,
  Bell, BookOpen, Mail, GitBranch, LifeBuoy, ChevronDown, ChevronRight, FolderOpen,
  Sparkles, Calendar, Share2, ClipboardList, ListTodo, Inbox, FileText, LayoutGrid, Shield,
} from "lucide-react";

const mainNavItems = [
  { href: "/portal/ask", label: "Ask Axiploy", icon: MessageSquare, highlight: true },
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/workforce", label: "AI Workforce", icon: Bot },
  { href: "/portal/workflows", label: "Workflow Health", icon: GitBranch },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
  { href: "/portal/reports", label: "Reports", icon: BarChart2 },
  { href: "/portal/activity", label: "Activity", icon: Activity },
  { href: "/portal/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/portal/templates", label: "Email Templates", icon: Mail },
  { href: "/portal/support", label: "Support", icon: LifeBuoy },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

const onboardingNavItems = [
  { href: "/portal/onboarding", label: "Onboarding", icon: UserCheck },
  { href: "/portal/forms/new-employee", label: "New Employee", icon: FilePlus },
  { href: "/portal/approvals", label: "Approvals", icon: CheckSquare, badge: true },
];

const ONBOARDING_PATHS = ["/portal/onboarding", "/portal/forms/new-employee", "/portal/approvals"];

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
  { href: "/portal/admin-assist/inbox", label: "Inbox", icon: Inbox },
  { href: "/portal/admin-assist/emails", label: "Email Drafts", icon: FileText },
  { href: "/portal/admin-assist/reports", label: "Reports", icon: BarChart2 },
];

const ADMIN_ASSIST_PATHS = ["/portal/admin-assist"];

const complianceNavItems = [
  { href: "/portal/compliance", label: "Compliance Register", icon: Shield },
];

const COMPLIANCE_PATHS = ["/portal/compliance"];

interface PortalSidebarProps {
  open: boolean;
  onClose: () => void;
  onAskToggle: () => void;
}

export default function PortalSidebar({ open, onClose, onAskToggle }: PortalSidebarProps) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [hasOnboarding, setHasOnboarding] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [hasSocial, setHasSocial] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [hasCompliance, setHasCompliance] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);

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
  }, [pathname]);

  useEffect(() => {
    fetch("/api/portal/approvals")
      .then((r) => r.json())
      .then((d) => {
        const pending = (d.approvals || []).filter((a: { status: string }) => a.status === "pending").length;
        setPendingCount(pending);
      })
      .catch(() => {});

    fetch("/api/portal/packages")
      .then((r) => r.json())
      .then((d) => {
        setHasOnboarding(!!d.onboarding);
        setHasSocial(!!d.social);
        setHasAdmin(!!d.admin);
        setHasCompliance(!!d.compliance);
      })
      .catch(() => {});
  }, []);

  function renderNavItem(item: { href: string; label: string; icon: React.ElementType; highlight?: boolean; badge?: boolean }, indented = false) {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const isAsk = !!item.highlight;
    const badgeCount = item.badge ? pendingCount : 0;

    return (
      <li key={item.href}>
        <div className="flex items-center gap-1">
          <Link
            href={item.href}
            onClick={onClose}
            className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${indented ? "pl-6" : ""} ${
              active && isAsk
                ? "bg-gradient-to-r from-accent-blue/20 to-accent-cyan/10 text-accent-blue border border-accent-blue/30"
                : active
                ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/20"
                : isAsk
                ? "text-accent-blue/80 hover:text-accent-blue hover:bg-accent-blue/5 border border-accent-blue/10 hover:border-accent-blue/25"
                : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
            }`}
          >
            <item.icon size={16} className={active || isAsk ? "text-accent-blue" : "text-text-muted"} />
            <span className="flex-1">{item.label}</span>
            {badgeCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {badgeCount}
              </span>
            )}
          </Link>
          {isAsk && (
            <button
              onClick={() => { onClose(); onAskToggle(); }}
              title="Quick chat"
              className="p-2 rounded-lg text-accent-blue/60 hover:text-accent-blue hover:bg-accent-blue/10 transition-colors flex-shrink-0"
            >
              <MessageSquare size={14} />
            </button>
          )}
        </div>
      </li>
    );
  }

  const groupActive = ONBOARDING_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const socialGroupActive = SOCIAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const adminGroupActive = ADMIN_ASSIST_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const complianceGroupActive = COMPLIANCE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.06]">
        <div className="overflow-hidden h-10 flex items-center">
          <Image src="/logo.png" alt="Axiploy" width={400} height={120} className="h-44 w-auto object-contain scale-[1.1] origin-left" />
        </div>
        <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text-primary">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-text-muted/50 text-[10px] font-semibold tracking-widest uppercase px-3 mb-3">
          Portal
        </p>
        <ul className="space-y-0.5">
          {mainNavItems.map((item, idx) => (
            <div key={item.href}>
              {renderNavItem(item)}
              {idx === 0 && <div className="my-2 border-t border-white/[0.06]" />}
            </div>
          ))}

          {/* AI Onboarding group — only shown if client has onboarding package */}
          {hasOnboarding && (
            <li>
              <button
                onClick={() => setOnboardingOpen((v) => !v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  groupActive
                    ? "text-accent-blue"
                    : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
                }`}
              >
                <FolderOpen size={16} className={groupActive ? "text-accent-blue" : "text-text-muted"} />
                <span className="flex-1 text-left">AI Onboarding</span>
                {pendingCount > 0 && !onboardingOpen && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {pendingCount}
                  </span>
                )}
                {onboardingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {onboardingOpen && (
                <ul className="mt-0.5 space-y-0.5 border-l border-white/[0.06] ml-5">
                  {onboardingNavItems.map((item) => renderNavItem(item, true))}
                </ul>
              )}
            </li>
          )}

          {/* AI Admin group — only shown if client has admin package */}
          {hasAdmin && (
            <li>
              <button
                onClick={() => setAdminOpen((v) => !v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  adminGroupActive ? "text-accent-blue" : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
                }`}
              >
                <ClipboardList size={16} className={adminGroupActive ? "text-accent-blue" : "text-text-muted"} />
                <span className="flex-1 text-left">AI Admin</span>
                {adminOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {adminOpen && (
                <ul className="mt-0.5 space-y-0.5 border-l border-white/[0.06] ml-5">
                  {adminNavItems.map((item) => renderNavItem(item, true))}
                </ul>
              )}
            </li>
          )}

          {/* AI Compliance group */}
          {hasCompliance && (
            <li>
              <button
                onClick={() => setComplianceOpen((v) => !v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  complianceGroupActive ? "text-accent-blue" : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
                }`}>
                <Shield size={16} className={complianceGroupActive ? "text-accent-blue" : "text-text-muted"} />
                <span className="flex-1 text-left">AI Compliance</span>
                {complianceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {complianceOpen && (
                <ul className="mt-0.5 space-y-0.5 border-l border-white/[0.06] ml-5">
                  {complianceNavItems.map((item) => renderNavItem(item, true))}
                </ul>
              )}
            </li>
          )}

          {/* AI Social group — only shown if client has social media package */}
          {hasSocial && (
            <li>
              <button
                onClick={() => setSocialOpen((v) => !v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  socialGroupActive
                    ? "text-accent-blue"
                    : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
                }`}
              >
                <Share2 size={16} className={socialGroupActive ? "text-accent-blue" : "text-text-muted"} />
                <span className="flex-1 text-left">AI Social</span>
                {socialOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {socialOpen && (
                <ul className="mt-0.5 space-y-0.5 border-l border-white/[0.06] ml-5">
                  {socialNavItems.map((item) => renderNavItem(item, true))}
                </ul>
              )}
            </li>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <p className="text-text-muted/40 text-xs text-center">Axiploy Portal · MVP</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-surface border-r border-white/[0.06] h-screen sticky top-0">
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
