"use client";

import { useState, useEffect } from "react";
import { Check, X, Trash2, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface SocialPost {
  id: string;
  platform: "facebook" | "instagram" | "linkedin" | "twitter";
  content: string;
  image_url: string | null;
  status: string;
  post_group_id: string;
  created_at: string;
  approved_at: string | null;
  published_at: string | null;
}

const PLATFORM_META = {
  facebook: { label: "Facebook", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  instagram: { label: "Instagram", badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  linkedin: { label: "LinkedIn", badge: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  twitter: { label: "Twitter / X", badge: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function PostsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"draft" | "approved" | "published">("draft");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/social/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: string, status: string) {
    setActionLoading(id);
    await fetch("/api/portal/social/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status, ...(status === "approved" ? { approved_at: new Date().toISOString() } : {}), ...(status === "published" ? { published_at: new Date().toISOString() } : {}) } : p));
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    await fetch("/api/portal/social/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setActionLoading(null);
  }

  const filtered = posts.filter((p) => p.status === tab);
  const counts = {
    draft: posts.filter((p) => p.status === "draft").length,
    approved: posts.filter((p) => p.status === "approved").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">All Posts</h1>
          <p className="text-text-muted text-[13px] mt-1">Review, approve and track your AI-generated social media posts.</p>
        </div>
        <Link href="/portal/social" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[13px] font-medium hover:bg-accent-blue/20 transition-colors">
          + Create Posts
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl glass border border-white/[0.06] w-fit">
        {(["draft", "approved", "published"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors capitalize ${tab === t ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary"}`}>
            {t === "draft" ? "Drafts" : t === "approved" ? "Approved" : "Published"}
            {counts[t] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t ? "bg-accent-blue/30 text-accent-blue" : "bg-white/[0.08] text-text-muted"}`}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-text-muted/40" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-dashed border-white/[0.08]">
          <p className="text-text-muted text-[13px]">
            {tab === "draft" ? "No draft posts — " : tab === "approved" ? "No approved posts yet — " : "No published posts yet — "}
            {tab !== "published" && <Link href="/portal/social" className="text-accent-blue hover:underline">generate some posts</Link>}
            {tab === "published" && "approve posts first, then mark them as published after you post them."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const meta = PLATFORM_META[post.platform];
            return (
              <div key={post.id} className="glass rounded-xl p-4 border border-white/[0.06]">
                <div className="flex items-start gap-4">
                  {post.image_url && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.image_url} alt="Post image" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="text-text-muted/40 text-[10px]">{timeAgo(post.created_at)}</span>
                      {post.approved_at && tab === "approved" && (
                        <span className="text-text-muted/40 text-[10px]">· Approved {timeAgo(post.approved_at)}</span>
                      )}
                    </div>
                    <p className="text-text-muted text-[13px] leading-relaxed line-clamp-3">{post.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                  {tab === "draft" && (
                    <>
                      <button onClick={() => handleAction(post.id, "rejected")} disabled={actionLoading === post.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                        <X size={12} /> Reject
                      </button>
                      <button onClick={() => handleAction(post.id, "approved")} disabled={actionLoading === post.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                        {actionLoading === post.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Approve
                      </button>
                    </>
                  )}
                  {tab === "approved" && (
                    <>
                      <button onClick={() => handleAction(post.id, "published")} disabled={actionLoading === post.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors disabled:opacity-50">
                        {actionLoading === post.id ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                        Mark as Published
                      </button>
                      <button onClick={() => handleAction(post.id, "draft")} disabled={actionLoading === post.id}
                        className="px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted text-xs hover:bg-white/[0.06] hover:text-text-primary transition-colors">
                        Un-approve
                      </button>
                    </>
                  )}
                  {tab === "published" && (
                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                      <Check size={12} /> Published {post.published_at ? timeAgo(post.published_at) : ""}
                    </span>
                  )}
                  <button onClick={() => handleDelete(post.id)} disabled={actionLoading === post.id}
                    className="ml-auto p-1.5 rounded-lg text-text-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
