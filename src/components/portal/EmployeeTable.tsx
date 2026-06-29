"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OnboardingRecord, EmployeeStatus } from "@/lib/types";
import StatusPill from "./StatusPill";
import { Search, ChevronRight, Trash2 } from "lucide-react";

const ALL_STATUSES: EmployeeStatus[] = [
  "New", "Welcome Sent", "In Progress", "Missing Documents",
  "At Risk", "Ready for Review", "Complete", "Paused", "Cancelled",
];

export default function EmployeeTable({ records }: { records: OnboardingRecord[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EmployeeStatus | "All">("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const filtered = records.filter((r) => {
    const matchSearch =
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.role.toLowerCase().includes(search.toLowerCase()) ||
      r.manager.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setDeleting(true);
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/portal/onboarding/${id}`, { method: "DELETE" })
      )
    );
    setSelected(new Set());
    setConfirming(false);
    setDeleting(false);
    router.refresh();
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search employees, roles, managers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent-blue/40 transition-colors"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as EmployeeStatus | "All")}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue/40 transition-colors"
        >
          <option value="All">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Bulk delete bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            {confirming ? (
              <>
                <span className="text-xs text-text-muted whitespace-nowrap">Delete {selected.size} record{selected.size !== 1 ? "s" : ""}?</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-text-muted text-sm font-medium hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors whitespace-nowrap"
              >
                <Trash2 size={14} />
                Delete {selected.size} selected
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 pl-5 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-white/20 bg-white/[0.04] accent-blue-500 cursor-pointer"
                />
              </th>
              {["Employee", "Role", "Start Date", "Manager", "Status", "Risk", "Missing Docs", "Next Action"].map((h) => (
                <th key={h} className="text-left text-text-muted text-xs font-medium px-4 py-3 last:pr-5">
                  {h}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`border-b border-white/[0.04] last:border-0 transition-colors ${selected.has(r.id) ? "bg-accent-blue/5" : "hover:bg-white/[0.02]"}`}
              >
                <td className="px-4 py-3.5 pl-5 w-8">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                    className="rounded border-white/20 bg-white/[0.04] accent-blue-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-text-primary text-sm font-medium">{r.employeeName}</p>
                  <p className="text-text-muted text-xs">{r.department}</p>
                </td>
                <td className="px-4 py-3.5 text-text-muted text-sm">{r.role}</td>
                <td className="px-4 py-3.5 text-text-muted text-sm whitespace-nowrap">
                  {new Date(r.startDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3.5 text-text-muted text-sm">{r.manager}</td>
                <td className="px-4 py-3.5"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3.5"><StatusPill status={r.riskLevel} /></td>
                <td className="px-4 py-3.5 text-center">
                  {r.missingDocuments > 0 ? (
                    <span className="text-orange-400 font-semibold text-sm">{r.missingDocuments}</span>
                  ) : (
                    <span className="text-emerald-400 text-sm">✓</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-text-muted text-xs max-w-[180px] truncate">{r.nextAction}</td>
                <td className="px-4 py-3.5 pr-5">
                  <Link href={`/portal/onboarding/${r.id}`} className="text-text-muted hover:text-accent-cyan transition-colors">
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-text-muted text-sm py-10">
                  No employees match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
