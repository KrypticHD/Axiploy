"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Bot, UserCheck, CheckSquare,
  BarChart2, Activity, FilePlus, Settings, X, MessageSquare,
  Bell, BookOpen, Mail, GitBranch, LifeBuoy,
} from "lucide-react";
import { MOCK_APPROVALS } from "@/lib/mock-data";

const pendingApprovals = MOCK_APPROVALS.filter((a) => a.status === "pending").length;

const navItems = [
  { href: "/portal/ask", label: "Ask Axiploy", icon: MessageSquare, highlight: true },
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/workforce", label: "AI Workforce", icon: Bot },
  { href: "/portal/workflows", label: "Workflow Health", icon: GitBranch },
  { href: "/portal/onboarding", label: "Onboarding", icon: UserCheck },
  { href: "/portal/approvals", label: "Approvals", icon: CheckSquare, badge: pendingApprovals },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
  { href: "/portal/reports", label: "Reports", icon: BarChart2 },
  { href: "/portal/activity", label: "Activity", icon: Activity },
  { href: "/portal/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/portal/templates", label: "Email Templates", icon: Mail },
  { href: "/portal/forms/new-employee", label: "New Employee", icon: FilePlus },
  { href: "/portal/support", label: "Support", icon: LifeBuoy },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

interface PortalSidebarProps {
  open: boolean;
  onClose: () => void;
  onAskToggle: () => void;
}

export default function PortalSidebar({ open, onClose, onAskToggle }: PortalSidebarProps) {
  const pathname = usePathname();

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
          {navItems.map((item, idx) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const isAsk = "highlight" in item && item.highlight;
            return (
              <div key={item.href}>
                <li>
                  <div className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
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
                      {"badge" in item && item.badge ? (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      ) : null}
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
                {idx === 0 && (
                  <div className="my-2 border-t border-white/[0.06]" />
                )}
              </div>
            );
          })}
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
