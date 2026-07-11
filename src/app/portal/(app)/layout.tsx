"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Lock } from "lucide-react";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalTopbar from "@/components/portal/PortalTopbar";
import AskPanel from "@/components/portal/AskPanel";
import EmptyPreviewBanner from "@/components/portal/EmptyPreviewBanner";
import CommandPalette from "@/components/portal/CommandPalette";

// Route prefix → module key. Anyone navigating directly to a gated URL
// (not just clicking a hidden sidebar item) is blocked here.
const GATED_ROUTES: { prefix: string; module: string }[] = [
  { prefix: "/portal/social", module: "social" },
  { prefix: "/portal/admin-assist", module: "admin" },
  { prefix: "/portal/workforce", module: "ai_employees" },
  { prefix: "/portal/workflows", module: "workflow_health" },
  { prefix: "/portal/knowledge", module: "knowledge_base" },
  { prefix: "/portal/scheduler", module: "scheduler" },
];

function useModuleGate(pathname: string) {
  const [blocked, setBlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const match = GATED_ROUTES.find((r) => pathname.startsWith(r.prefix));
    if (!match) {
      const t = setTimeout(() => { setBlocked(false); setChecked(true); }, 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    const startTimer = setTimeout(() => setChecked(false), 0);
    fetch("/api/portal/packages")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setBlocked(d.enabledModules != null && !d.enabledModules.includes(match.module)); })
      .catch(() => { if (!cancelled) setBlocked(false); })
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; clearTimeout(startTimer); };
  }, [pathname]);

  return { blocked, checked };
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const pathname = usePathname();
  const { blocked, checked } = useModuleGate(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <PortalSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAskToggle={() => setPanelOpen((v) => !v)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PortalTopbar onMenuOpen={() => setSidebarOpen(true)} />
        <EmptyPreviewBanner />
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          {!checked ? null : blocked ? (
            <div className="glass rounded-2xl border border-white/[0.06] p-10 text-center max-w-md mx-auto mt-10">
              <Lock size={22} className="text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-primary text-sm font-medium">This module isn&apos;t enabled for your account</p>
              <p className="text-text-muted text-[12px] mt-1.5">Contact your Axiploy account manager to enable it.</p>
            </div>
          ) : children}
        </main>
      </div>

      {/* Floating Ask Axiploy button */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent-blue hover:bg-accent-blue-light text-white text-[13px] font-medium shadow-lg shadow-accent-blue/30 transition-all duration-200 hover:scale-105"
      >
        <MessageSquare size={16} />
        <span className="hidden sm:inline">Ask Axiploy</span>
      </button>

      <AskPanel open={panelOpen} onClose={() => setPanelOpen(false)} />

      <CommandPalette
        onAsk={(query) => {
          if (query) sessionStorage.setItem("axiploy_ask_prefill", query);
          setPanelOpen(true);
        }}
      />
    </div>
  );
}
