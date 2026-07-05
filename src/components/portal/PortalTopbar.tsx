"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Menu, LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface User {
  name: string;
  role: string;
  clientName: string;
  email: string;
}

const PAGE_LABELS: [string, string][] = [
  ["/portal/inbox", "Inbox"],
  ["/portal/dashboard", "Dashboard"],
  ["/portal/workforce", "AI Employees"],
  ["/portal/workflows", "Workflow Health"],
  ["/portal/reports", "Reports"],
  ["/portal/activity", "Activity"],
  ["/portal/knowledge", "Knowledge Base"],
  ["/portal/templates", "Email Templates"],
  ["/portal/support", "Support"],
  ["/portal/settings", "Settings"],
  ["/portal/onboarding", "Onboarding"],
  ["/portal/site-readiness", "Site Readiness"],
  ["/portal/forms/new-employee", "New Employee"],
  ["/portal/approvals", "Approvals"],
  ["/portal/admin-assist/tasks", "Tasks"],
  ["/portal/admin-assist/meetings", "Meetings"],
  ["/portal/admin-assist/inbox", "Email Inbox"],
  ["/portal/admin-assist/emails", "Email Drafts"],
  ["/portal/admin-assist/reports", "Admin Reports"],
  ["/portal/admin-assist", "Daily Briefing"],
  ["/portal/social/posts", "Scheduled Posts"],
  ["/portal/social/analytics", "Social Analytics"],
  ["/portal/social", "Post Studio"],
  ["/portal/compliance", "Compliance Register"],
  ["/portal/safety", "Safety Register"],
  ["/portal/notifications", "Notifications"],
  ["/portal/ask", "Ask Axiploy"],
];

export default function PortalTopbar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data && !data.error) setUser(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/portal/inbox?count=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.total === "number") setInboxCount(d.total); })
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.push("/portal/login");
  }

  const pageLabel = PAGE_LABELS.find(([p]) => pathname === p || pathname.startsWith(p + "/"))?.[1] || "Portal";
  const displayName = user?.name || "—";
  const displayClient = user?.clientName || "";
  const initials = displayName !== "—"
    ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 bg-surface/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuOpen}
          className="lg:hidden text-text-muted hover:text-text-primary"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2 min-w-0 text-[13px]">
          {displayClient && (
            <>
              <span className="text-text-muted truncate hidden sm:block">{displayClient}</span>
              <span className="text-text-muted/30 hidden sm:block">/</span>
            </>
          )}
          <span className="text-text-primary font-medium truncate">{pageLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Link
          href="/portal/inbox"
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
          title="Work inbox"
        >
          <Bell size={15} />
          {inboxCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-accent-blue text-white text-[9px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center">
              {inboxCount > 99 ? "99" : inboxCount}
            </span>
          )}
        </Link>

        <Link
          href="/portal/settings"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
          title="Settings"
        >
          <Settings size={15} />
        </Link>

        <div className="flex items-center gap-2 ml-1 pl-2.5 border-l border-white/[0.08]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-white text-[10px] font-bold">
            {initials}
          </div>
          <span className="hidden sm:block text-text-primary text-[12px] font-medium">{displayName}</span>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-white/[0.05] transition-colors"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
