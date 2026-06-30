"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Sparkles, Check, X, Trash2, Image as ImageIcon, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface SocialAsset {
  id: string;
  name: string;
  file_url: string;
  file_size_kb: number;
  created_at: string;
}

interface SocialPost {
  id: string;
  platform: "facebook" | "instagram" | "linkedin" | "twitter";
  content: string;
  image_url: string;
  status: string;
  post_group_id: string;
}

const PLATFORM_META = {
  facebook: { label: "Facebook", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300", limit: 500 },
  instagram: { label: "Instagram", color: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500/10", badge: "bg-pink-500/20 text-pink-300", limit: 300 },
  linkedin: { label: "LinkedIn", color: "text-sky-400", border: "border-sky-500/30", bg: "bg-sky-500/10", badge: "bg-sky-500/20 text-sky-300", limit: 600 },
  twitter: { label: "Twitter / X", color: "text-slate-300", border: "border-slate-500/30", bg: "bg-slate-500/10", badge: "bg-slate-500/20 text-slate-300", limit: 280 },
};

export default function PostStudioPage() {
  const [assets, setAssets] = useState<SocialAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<SocialPost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generatedGroupId, setGeneratedGroupId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/portal/social/assets")
      .then((r) => r.json())
      .then((d) => setAssets(d.assets || []))
      .finally(() => setLoadingAssets(false));
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/portal/social/assets/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.asset) {
      setAssets((prev) => [data.asset, ...prev]);
      setSelectedAssetId(data.asset.id);
    }
  }

  async function handleDeleteAsset(asset: SocialAsset, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch("/api/portal/social/assets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: asset.id, fileUrl: asset.file_url }),
    });
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    if (selectedAssetId === asset.id) setSelectedAssetId(null);
  }

  async function handleGenerate() {
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset) return;
    setGenerating(true);
    setDrafts([]);
    setGeneratedGroupId(null);

    const res = await fetch("/api/portal/social/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: asset.file_url, context }),
    });
    const data = await res.json();
    setGenerating(false);

    if (data.posts) {
      setDrafts(data.posts);
      setGeneratedGroupId(data.posts[0]?.post_group_id || null);
      setTimeout(() => draftsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }

  async function handleAction(post: SocialPost, status: "approved" | "rejected") {
    setActionLoading(post.id);
    await fetch("/api/portal/social/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, status }),
    });
    setDrafts((prev) => prev.map((p) => p.id === post.id ? { ...p, status } : p));
    setActionLoading(null);
  }

  async function handleSaveEdit(post: SocialPost) {
    setActionLoading(post.id);
    // Update locally only — content editing not stored to DB in this phase
    setDrafts((prev) => prev.map((p) => p.id === post.id ? { ...p, content: editContent } : p));
    setEditingId(null);
    setActionLoading(null);
  }

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const pendingDrafts = drafts.filter((d) => d.status === "draft");
  const approvedDrafts = drafts.filter((d) => d.status === "approved");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Post Studio</h1>
          <p className="text-text-muted text-sm mt-1">Upload photos, generate platform-specific posts with AI, and approve them for publishing.</p>
        </div>
        <Link href="/portal/social/posts"
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          View all posts <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Photo Library */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Photo Library</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            />
          </div>

          {loadingAssets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-text-muted/40" />
            </div>
          ) : assets.length === 0 ? (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-12 rounded-xl border border-dashed border-white/[0.10] hover:border-accent-blue/30 hover:bg-accent-blue/5 transition-colors text-text-muted/50 hover:text-text-muted">
              <ImageIcon size={32} />
              <div className="text-center">
                <p className="text-sm font-medium">Upload your first photo</p>
                <p className="text-xs mt-0.5">PNG, JPG or WEBP up to 10MB</p>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id === selectedAssetId ? null : asset.id)}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedAssetId === asset.id
                      ? "border-accent-blue shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                      : "border-white/[0.06] hover:border-white/[0.15]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                  {selectedAssetId === asset.id && (
                    <div className="absolute inset-0 bg-accent-blue/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => handleDeleteAsset(asset, e)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <Trash2 size={10} className="text-white" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {selectedAsset && (
            <div className="pt-2 border-t border-white/[0.06]">
              <p className="text-text-muted text-xs mb-2">Add context for better posts (optional)</p>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. This is from our team BBQ last Friday, focus on company culture..."
                rows={2}
                className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.10] rounded-xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40 resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-60"
              >
                {generating ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating posts...</>
                ) : (
                  <><Sparkles size={14} /> Generate Posts for All Platforms</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: Drafts */}
        <div className="space-y-4" ref={draftsRef}>
          {generating && (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                <Sparkles size={20} className="text-accent-blue animate-pulse" />
              </div>
              <p className="text-text-primary font-medium">AI is writing your posts...</p>
              <p className="text-text-muted text-sm">Generating content for Facebook, Instagram, LinkedIn and Twitter</p>
            </div>
          )}

          {!generating && drafts.length === 0 && (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-white/[0.08]">
              <Sparkles size={28} className="text-text-muted/20" />
              <p className="text-text-muted text-sm">Select a photo and click Generate Posts to get started</p>
            </div>
          )}

          {drafts.length > 0 && (
            <>
              {approvedDrafts.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Check size={14} className="text-emerald-400" />
                  <p className="text-emerald-400 text-xs font-medium">{approvedDrafts.length} post{approvedDrafts.length !== 1 ? "s" : ""} approved — ready to publish</p>
                  <Link href="/portal/social/posts" className="ml-auto text-emerald-400/70 hover:text-emerald-400 text-xs">View all →</Link>
                </div>
              )}

              {(["facebook", "instagram", "linkedin", "twitter"] as const).map((platform) => {
                const post = drafts.find((d) => d.platform === platform);
                if (!post) return null;
                const meta = PLATFORM_META[platform];
                const isEditing = editingId === post.id;
                const content = isEditing ? editContent : post.content;
                const charCount = content.length;
                const overLimit = charCount > meta.limit;

                return (
                  <div key={platform} className={`glass rounded-2xl border ${post.status === "approved" ? "border-emerald-500/30" : post.status === "rejected" ? "border-red-500/20 opacity-60" : meta.border}`}>
                    <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${meta.bg}`}>
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${overLimit ? "text-red-400" : "text-text-muted/50"}`}>{charCount}/{meta.limit}</span>
                        {post.status === "approved" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Approved</span>}
                        {post.status === "rejected" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Rejected</span>}
                      </div>
                    </div>

                    <div className="p-4">
                      {isEditing ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none resize-none ${overLimit ? "border-red-500/40" : "border-white/[0.10] focus:border-accent-blue/40"}`}
                        />
                      ) : (
                        <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      )}
                    </div>

                    {post.status === "draft" && (
                      <div className="flex items-center gap-2 px-4 pb-4">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveEdit(post)} disabled={overLimit}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue text-white text-xs font-medium disabled:opacity-40 hover:bg-accent-blue-light transition-colors">
                              <Check size={12} /> Save
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted text-xs hover:bg-white/[0.06] transition-colors">
                              <X size={12} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(post.id); setEditContent(post.content); }}
                              className="px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted text-xs hover:bg-white/[0.06] hover:text-text-primary transition-colors">
                              Edit
                            </button>
                            <button onClick={() => handleAction(post, "rejected")} disabled={actionLoading === post.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                              <X size={12} /> Reject
                            </button>
                            <button onClick={() => handleAction(post, "approved")} disabled={actionLoading === post.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                              {actionLoading === post.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Approve
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
