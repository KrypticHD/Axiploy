"use client";

import { useState, useEffect } from "react";
import { BarChart2, Users, TrendingUp, Loader2, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";

interface PostStats {
  total: number;
  draft: number;
  approved: number;
  published: number;
}

interface PlatformConfig {
  handle?: string;
}

interface AgentConfig {
  platforms?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  brandVoice?: string;
  postFrequencyPerWeek?: number;
}

const PLATFORM_DEFS = [
  { key: "facebook" as const, label: "Facebook", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { key: "instagram" as const, label: "Instagram", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { key: "linkedin" as const, label: "LinkedIn", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  { key: "twitter" as const, label: "Twitter / X", color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20" },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [postStats, setPostStats] = useState<PostStats>({ total: 0, draft: 0, approved: 0, published: 0 });
  const [config, setConfig] = useState<AgentConfig>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/social/posts").then((r) => r.json()),
    ]).then(([postsData]) => {
      const posts = postsData.posts || [];
      setPostStats({
        total: posts.length,
        draft: posts.filter((p: { status: string }) => p.status === "draft").length,
        approved: posts.filter((p: { status: string }) => p.status === "approved").length,
        published: posts.filter((p: { status: string }) => p.status === "published").length,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-text-muted/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Analytics</h1>
        <p className="text-text-muted text-sm mt-1">Track your social media performance across all platforms.</p>
      </div>

      {/* Post activity summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Posts Generated", value: postStats.total, icon: Zap, color: "text-accent-blue" },
          { label: "Awaiting Approval", value: postStats.draft, icon: BarChart2, color: "text-amber-400" },
          { label: "Approved", value: postStats.approved, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Published", value: postStats.published, icon: Users, color: "text-accent-cyan" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <s.icon size={16} className={s.color} />
              <p className="text-text-muted text-xs">{s.label}</p>
            </div>
            <p className="font-heading text-3xl font-bold text-text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Platform connections */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-text-primary">Platform Connections</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Phase 2 — Coming Soon</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PLATFORM_DEFS.map((platform) => (
            <div key={platform.key} className={`rounded-xl border p-4 ${platform.border} bg-white/[0.02]`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${platform.bg}`}>
                    <span className={`text-xs font-bold ${platform.color}`}>{platform.label[0]}</span>
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{platform.label}</p>
                    <p className="text-text-muted/50 text-[10px]">Not connected</p>
                  </div>
                </div>
                <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted/40 text-xs cursor-not-allowed">
                  <ExternalLink size={11} /> Connect
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Followers", "Reach", "Engagement"].map((metric) => (
                  <div key={metric} className="text-center py-2 rounded-lg bg-white/[0.02]">
                    <p className="text-text-muted/30 text-lg font-bold">—</p>
                    <p className="text-text-muted/40 text-[10px] mt-0.5">{metric}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-text-muted/50 text-xs mt-4 text-center">
          Live platform analytics (followers, reach, engagement) via Facebook Graph API, LinkedIn API, and Twitter API will be available in Phase 2.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link href="/portal/social" className="glass rounded-2xl p-5 border border-white/[0.06] hover:border-accent-blue/20 transition-colors group">
          <p className="font-medium text-text-primary group-hover:text-accent-blue transition-colors">Generate New Posts</p>
          <p className="text-text-muted text-xs mt-1">Upload a photo and let AI create platform-specific content</p>
        </Link>
        <Link href="/portal/social/posts" className="glass rounded-2xl p-5 border border-white/[0.06] hover:border-accent-blue/20 transition-colors group">
          <p className="font-medium text-text-primary group-hover:text-accent-blue transition-colors">Review Drafts</p>
          <p className="text-text-muted text-xs mt-1">
            {postStats.draft > 0 ? `${postStats.draft} post${postStats.draft !== 1 ? "s" : ""} waiting for your approval` : "No pending drafts right now"}
          </p>
        </Link>
      </div>
    </div>
  );
}
