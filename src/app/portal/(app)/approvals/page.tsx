"use client";

import { useState, useEffect } from "react";
import ApprovalCard from "@/components/portal/ApprovalCard";
import { CheckSquare, History, Clock } from "lucide-react";

function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [approvals, setApprovals] = useState<Array<{ id: string; clientId: string; digitalEmployee: string; actionType: string; relatedPerson: string; relatedBusiness: string; draftContent: string; reason: string; status: "pending" | "approved" | "rejected"; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/approvals")
      .then((r) => r.json())
      .then((data) => {
        if (data.approvals?.length > 0) {
          setApprovals(data.approvals.map((a: Record<string, string>) => ({
            id: a.id,
            clientId: a.client_id,
            digitalEmployee: a.requested_by || "AI Assistant",
            actionType: a.type,
            relatedPerson: a.employee_name || "",
            relatedBusiness: "",
            draftContent: a.description || "",
            reason: a.description || "",
            status: a.status as "pending" | "approved" | "rejected",
            createdAt: a.created_at,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = approvals.filter((a) => a.status === "pending");
  const history = approvals.filter((a) => a.status !== "pending");

  async function handleAction(id: string, status: "approved" | "rejected") {
    setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    await fetch("/api/portal/approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Approvals Centre</h1>
        <p className="text-text-muted text-sm mt-1">
          Actions your AI employees need you to review before proceeding.
        </p>
      </div>

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
          {loading ? (
            <div className="py-10 text-center text-text-muted text-sm">Loading approvals...</div>
          ) : (
            <>
              {pending.length > 0 && (
                <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-amber-500/20">
                  <CheckSquare size={15} className="text-amber-400" />
                  <p className="text-amber-300 text-sm font-medium">{pending.length} items awaiting your approval</p>
                </div>
              )}
              <div className="space-y-4">
                {pending.map((approval) => (
                  <ApprovalCard key={approval.id} approval={approval} onAction={handleAction} />
                ))}
                {pending.length === 0 && (
                  <div className="glass rounded-2xl p-10 text-center border border-white/[0.06]">
                    <CheckSquare size={24} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-text-primary font-medium text-sm">All caught up</p>
                    <p className="text-text-muted text-xs mt-1">No pending approvals right now</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {tab === "history" && (
        <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-sm font-medium text-text-primary">Approval History</p>
            <p className="text-xs text-text-muted mt-0.5">A record of all actions reviewed and decisions made</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {history.length === 0 && (
              <div className="px-5 py-10 text-center text-text-muted text-sm">No history yet</div>
            )}
            {history.map((a) => ({
              id: a.id,
              actionType: a.actionType,
              digitalEmployee: a.digitalEmployee,
              relatedPerson: a.relatedPerson,
              approvedBy: "You",
              decision: a.status as "approved" | "rejected",
              decidedAt: a.createdAt,
            })).map((h) => (
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
