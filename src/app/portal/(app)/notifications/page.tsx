"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckSquare, AlertTriangle, XCircle, Clock, CheckCheck, ExternalLink } from "lucide-react";

type NotifType = "approval" | "risk" | "failed" | "overdue" | "error";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  href: string;
  time: string;
}

const DISMISSED_KEY = "axiploy_dismissed_notifications";

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

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveDismissed(ids: Set<string>) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids])); } catch {}
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initial = getDismissed();
    setDismissed(initial);

    fetch("/api/portal/notifications")
      .then((r) => r.json())
      .then((data) => {
        const mapped: Notification[] = (data.notifications || []).map((n: Record<string, string>) => ({
          id: n.id,
          type: n.type as NotifType,
          title: n.title,
          body: n.body,
          href: HREF[n.type as NotifType] || "/portal/dashboard",
          time: n.createdAt,
        }));
        setNotifications(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function markRead(id: string) {
    setDismissed((prev) => {
      const next = new Set([...prev, id]);
      saveDismissed(next);
      return next;
    });
  }

  function markAllRead() {
    setDismissed((prev) => {
      const next = new Set([...prev, ...notifications.map((n) => n.id)]);
      saveDismissed(next);
      return next;
    });
  }

  const unread = notifications.filter((n) => !dismissed.has(n.id)).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-muted text-[13px] mt-1">
            {loading ? "Loading..." : unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/[0.10] hover:border-accent-blue/30 hover:text-accent-blue text-text-muted text-xs font-medium transition-colors"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {!loading && notifications.length === 0 ? (
        <div className="glass rounded-2xl border border-white/[0.08] p-12 text-center">
          <Bell size={32} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted text-[13px]">No notifications at the moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICON[n.type];
            const isRead = dismissed.has(n.id);
            return (
              <div
                key={n.id}
                className={`glass rounded-xl border border-white/[0.06] p-4 cursor-pointer transition-all ${!isRead ? "border-l-2 border-l-accent-blue" : ""}`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${COLOUR[n.type]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] font-medium ${isRead ? "text-text-muted" : "text-text-primary"}`}>{n.title}</p>
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
