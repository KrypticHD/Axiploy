"use client";

import { useState } from "react";
import type { Approval } from "@/lib/types";
import { CheckCircle2, XCircle, Edit3, ChevronDown, ChevronUp } from "lucide-react";

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ApprovalCard({ approval }: { approval: Approval }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(approval.status);

  if (status !== "pending") {
    return (
      <div className={`glass rounded-2xl p-5 border opacity-60 ${status === "approved" ? "border-emerald-500/20" : "border-red-500/20"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-xs">{approval.digitalEmployee} · {approval.actionType}</p>
            <p className="text-text-primary text-sm font-medium mt-0.5">{approval.relatedPerson}{approval.relatedBusiness ? ` — ${approval.relatedBusiness}` : ""}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${status === "approved" ? "text-emerald-300 border-emerald-500/25 bg-emerald-500/10" : "text-red-400 border-red-500/25 bg-red-500/10"}`}>
            {status === "approved" ? "Approved" : "Rejected"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/[0.08] hover:border-accent-blue/20 transition-colors overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                {approval.actionType}
              </span>
              <span className="text-text-muted/60 text-xs">{approval.digitalEmployee}</span>
            </div>
            <p className="text-text-primary font-medium text-sm">
              {approval.relatedPerson}
              {approval.relatedBusiness && <span className="text-text-muted font-normal"> — {approval.relatedBusiness}</span>}
            </p>
            <p className="text-text-muted text-xs mt-1">{approval.reason}</p>
          </div>
          <span className="text-text-muted/60 text-xs shrink-0">{formatTime(approval.createdAt)}</span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? "Hide draft" : "View draft content"}
        </button>

        {expanded && (
          <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-text-muted text-sm leading-relaxed whitespace-pre-line">
            {approval.draftContent}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setStatus("approved")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-xs font-medium transition-colors"
          >
            <CheckCircle2 size={13} /> Approve
          </button>
          <button
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text-muted text-xs font-medium transition-colors"
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            onClick={() => setStatus("rejected")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-medium transition-colors"
          >
            <XCircle size={13} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}
