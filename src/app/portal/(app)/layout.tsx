"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalTopbar from "@/components/portal/PortalTopbar";
import AskPanel from "@/components/portal/AskPanel";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <PortalSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAskToggle={() => setPanelOpen((v) => !v)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PortalTopbar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          {children}
        </main>
      </div>

      {/* Floating Ask Axiploy button */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium shadow-lg shadow-accent-blue/30 transition-all duration-200 hover:scale-105"
      >
        <MessageSquare size={16} />
        <span className="hidden sm:inline">Ask Axiploy</span>
      </button>

      <AskPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
