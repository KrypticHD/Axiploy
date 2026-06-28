"use client";

import { useState } from "react";
import ApprovalCard from "@/components/portal/ApprovalCard";
import { MOCK_APPROVALS, MOCK_USER } from "@/lib/mock-data";
import { CheckSquare, History, Clock } from "lucide-react";

const MOCK_HISTORY = [
  { id: "h-001", actionType: "Send Reminder Email", digitalEmployee: "AI Onboarding Assistant", relatedPerson: "Tom Reynolds", approvedBy: MOCK_USER.name, decision: "approved" as const, decidedAt: "2024-11-18T09:14:00Z" },
  { id: "h-002", actionType: "Escalate to Manager", digitalEmployee: "AI Onboarding Assistant", relatedPerson: "Claire Booth", approvedBy: MOCK_USER.name, decision: "approved" as const, decidedAt: "2024-11-17T14:32:00Z" },
  { id: "h-003", actionType: "Generate Onboarding Pack", digitalEmployee: "AI Admin Assistant", relatedPerson: "Mark Stevens", approvedBy: MOCK_USER.name, decision: "rejected" as const, decidedAt: "2024-11-16T11:05:00Z" },
  { id: "h-004", actionType: "Lead Follow-Up Email", digitalEmployee: "AI Growth Assistant", relatedPerson: "Sunrise Logistics", approvedBy: MOCK_USER.name, decision: "approved" as const, decidedAt: "2024-11-15T16:20:00Z" },
  { id: "h-005", actionType: "Send Compliance Checklist", digitalEmployee: "AI Admin Assistant", relatedPerson: "Sarah Mitchell", approvedBy: MOCK_USER.name, decision: "approved" as const, decidedAt: "2024-11-14T10:45:00Z" },
];

function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const pending = MOCK_APPROVALS.filter((a) => a.status === "pending");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Approvals Centre</h1>
        <p className="text-text-muted text-sm mt-1">
          Actions your AI employees need you to review before proceeding.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl border border-white/[0.06] w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "pending" ? "bg-accent-blue text-white" : "text-text-muted hover:text-text-primary"
          }`}
        >
          <CheckSquare size={14} />
          Pending
          {pending.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${tab === "pending" ? "bg-white/20 text-white" : "bg-amber-500 text-white"}`}>
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "history" ? "bg-accent-blue text-white" : "text-text-muted hover:text-text-primary"
          }`}
        >
          <History size={14} />
          History
        </button>
      </div>

      {tab === "pending" && (
        <>
          {pending.length > 0 && (
            <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-amber-500/20">
              <CheckSquare size={15} className="text-amber-400" />
              <p className="text-amber-300 text-sm font-medium">{pending.length} items awaiting your approval</p>
            </div>
          )}
          <div className="space-y-4">
            {MOCK_APPROVALS.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} />
            ))}
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-sm font-medium text-text-primary">Approval History</p>
            <p className="text-xs text-text-muted mt-0.5">A record of all actions reviewed and decisions made</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {MOCK_HISTORY.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${h.decision === "approved" ? "bg-emerald-400" : "bg-red-400"}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{h.actionType}</p>
                    <p className="text-xs text-text-muted mt-0.5">{h.digitalEmployee} · {h.relatedPerson}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-text-muted">{h.approvedBy}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Clock size={10} className="text-text-muted/50" />
                      <p className="text-[10px] text-text-muted/50">{fmt(h.decidedAt)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    h.decision === "approved"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {h.decision === "approved" ? "Approved" : "Rejected"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
