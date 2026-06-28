"use client";

import ActivityItem from "@/components/portal/ActivityItem";
import { MOCK_ACTIVITY } from "@/lib/mock-data";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import type { ActivityEntry } from "@/lib/types";

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/activity")
      .then((r) => r.json())
      .then((data) => {
        setActivity(data.activity?.length > 0 ? data.activity : MOCK_ACTIVITY);
      })
      .catch(() => setActivity(MOCK_ACTIVITY))
      .finally(() => setLoading(false));
  }, []);

  function downloadCSV() {
    const headers = ["Timestamp", "Digital Employee", "Action", "Result", "Status"];
    const rows = activity.map((e) => [
      new Date(e.timestamp).toLocaleString("en-AU"),
      e.digitalEmployee,
      e.action,
      e.result,
      e.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axiploy-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Activity Feed</h1>
          <p className="text-text-muted text-sm mt-1">Everything your AI employees have done, in real time.</p>
        </div>
        <button
          onClick={downloadCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/[0.10] hover:border-accent-blue/30 hover:text-accent-blue text-text-muted text-xs font-medium transition-colors flex-shrink-0"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="glass rounded-2xl px-6 py-2">
        {loading ? (
          <div className="py-10 text-center text-text-muted text-sm">Loading activity...</div>
        ) : activity.map((entry) => (
          <ActivityItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
