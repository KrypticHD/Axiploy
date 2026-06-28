"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, X } from "lucide-react";

const COOKIE = "axiploy_empty_preview";

function getCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=true`));
}

function setCookie(val: boolean) {
  if (val) {
    document.cookie = `${COOKIE}=true; path=/; max-age=86400`;
  } else {
    document.cookie = `${COOKIE}=; path=/; max-age=0`;
  }
}

export default function EmptyPreviewBanner() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setEnabled(getCookie());
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setCookie(next);
    window.location.reload();
  }

  if (!visible) return null;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium border-b ${enabled ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-white/[0.03] border-white/[0.06] text-text-muted"}`}>
      <div className="flex items-center gap-2">
        {enabled ? <Eye size={13} /> : <EyeOff size={13} />}
        {enabled
          ? "Empty state preview ON — showing what a new client sees (no mock data)"
          : "Empty state preview — toggle to see the portal with no data"}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className={`px-3 py-1 rounded-full border text-xs transition-colors ${enabled ? "bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30" : "bg-white/[0.06] border-white/[0.10] hover:bg-white/[0.10]"}`}
        >
          {enabled ? "Turn off" : "Turn on"}
        </button>
        <button onClick={() => setVisible(false)} className="text-text-muted/50 hover:text-text-muted">
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
