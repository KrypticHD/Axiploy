"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckSquare, AlertTriangle, XCircle, Clock, CheckCheck, ExternalLink } from "lucide-react";
import { MOCK_APPROVALS, MOCK_ONBOARDING, MOCK_ACTIVITY } from "@/lib/mock-data";

type NotifType = "approval" | "risk" | "failed" | "overdue" | "error";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  href: string;
  time: string;
  read: boolean;
}

function buildMockNotifications(): Notification[] {
  const items: Notification[] = [];
  MOCK_APPROVALS.filter((a) => a.status === "pending").forEach((a) => {
    items.push({ id: `appr-${a.id}`, type: "approval", title: "Approval Required", body: `${a.digitalEmployee} wants to ${a.actionType.toLowerCase()} for ${a.relatedPerson}.`, href: "/portal/approvals", time: a.createdAt, read: false });
  });
  MOCK_ONBOARDING.filter((e) => ["High", "Critical"].includes(e.riskLevel)).forEach((e) => {
    items.push({ id: `risk-${e.id}`, type: "risk", title: `High Risk: ${e.employeeName}`, body: `${e.riskLevel} risk — ${e.missingDocuments} document${e.missingDocuments !== 1 ? "s" : ""} missing.`, href: `/portal/onboarding/${e.id}`, time: e.lastContacted, read: false });
  });
  MOCK_ACTIVITY.filter((a) => a.status === "warning" || a.status === "error").forEach((a) => {
    items.push({ id: `act-${a.id}`, type: "failed", title: "Workflow Issue", body: `${a.digitalEmployee}: ${a.action} — ${a.result}`, href: "/portal/activity", time: a.timestamp, read: true });
  });
  return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

const ICON: Record<NotifType, React.FC<{ size?: number; className?: string }>> = {
  approval: CheckSquare, risk: AlertTriangle, failed: XCircle, overdue: Clock, error: XCircle,
};

const COLOUR: Record<NotifType, string> = {
  approval: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  risk: "text-red-400 bg-red-500/10 border-red-500/20",
  failed: "text-red-400 bg-red-500/10 border-red-500/20",
  overdue: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

const HREF: Record<NotifType, string> = {
  approval: "/portal/approvals", risk: "/portal/onboarding",
  failed: "/portal/activity", overdue: "/portal/onboarding", error: "/portal/workflows",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications?.length > 0) {
          const mapped: Notification[] = data.notifications.map((n: Record<string, string>) => ({
            id: n.id,
            type: n.type as NotifType,
            title: n.title,
            body: n.body,
            href: HREF[n.type as NotifType] || "/portal/dashboard",
            time: n.createdAt,
            read: false,
          }));
          setNotifications(mapped);
        } else {
          const mock = buildMockNotifications();
          setNotifications(mock);
          setRead(new Set(mock.filter((n) => n.read).map((n) => n.id)));
        }
      })
      .catch(() => {
        const mock = buildMockNotifications();
        setNotifications(mock);
        setRead(new Set(mock.filter((n) => n.read).map((n) => n.id)));
      })
      .finally(() => setLoading(false));
  }, []);

  const unread = notifications.filter((n) => !read.has(n.id)).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-muted text-sm mt-1">
            {loading ? "Loading..." : unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => setRead(new Set(notifications.map((n) => n.id)))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/[0.10] hover:border-accent-blue/30 hover:text-accent-blue text-text-muted text-xs font-medium transition-colors"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {!loading && notifications.length === 0 ? (
        <div className="glass rounded-2xl border border-white/[0.08] p-12 text-center">
          <Bell size={32} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted text-sm">No notifications at the moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICON[n.type];
            const isRead = read.has(n.id);
            return (
              <div
                key={n.id}
                className={`glass rounded-xl border border-white/[0.06] p-4 cursor-pointer transition-all ${!isRead ? "border-l-2 border-l-accent-blue" : ""}`}
                onClick={() => setRead((prev) => new Set([...prev, n.id]))}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${COLOUR[n.type]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${isRead ? "text-text-muted" : "text-text-primary"}`}>{n.title}</p>
                      {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-text-muted/50">
                        {new Date(n.time).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <Link href={n.href} className="inline-flex items-center gap-1 text-[10px] text-accent-blue hover:underline" onClick={(e) => e.stopPropagation()}>
                        View <ExternalLink size={9} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
