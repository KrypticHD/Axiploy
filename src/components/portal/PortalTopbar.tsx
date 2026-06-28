"use client";

import { useRouter } from "next/navigation";
import { Bell, Menu, LogOut, Settings } from "lucide-react";
import { MOCK_USER, MOCK_APPROVALS } from "@/lib/mock-data";
import Link from "next/link";

const pending = MOCK_APPROVALS.filter((a) => a.status === "pending").length;

export default function PortalTopbar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.push("/portal/login");
  }

  const initials = MOCK_USER.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 bg-surface/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="lg:hidden text-text-muted hover:text-text-primary"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-text-primary text-sm font-semibold leading-none">{MOCK_USER.clientName}</p>
          <p className="text-text-muted text-xs mt-0.5">AI Workforce Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Link
          href="/portal/approvals"
          className="relative w-9 h-9 rounded-xl glass flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          <Bell size={16} />
          {pending > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {pending}
            </span>
          )}
        </Link>

        <Link
          href="/portal/settings"
          className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          <Settings size={16} />
        </Link>

        {/* User */}
        <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-white/[0.08]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-text-primary text-xs font-medium leading-none">{MOCK_USER.name}</p>
            <p className="text-text-muted text-[10px] mt-0.5 capitalize">{MOCK_USER.role.replace("_", " ")}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center text-text-muted hover:text-red-400 transition-colors"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
