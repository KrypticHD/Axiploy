"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Sparkles, Check, X, Trash2, Image as ImageIcon, Loader2, ChevronRight, FolderPlus, Folder, FolderOpen, Images, FolderInput } from "lucide-react";
import Link from "next/link";

interface SocialAsset {
  id: string;
  name: string;
  file_url: string;
  file_size_kb: number;
  folder: string | null;
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
  const [folders, setFolders] = useState<string[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // null = All, "" = Uncategorized
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [movingAsset, setMovingAsset] = useState<string | null>(null); // asset id being moved
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
  const newFolderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    if (newFolderMode) setTimeout(() => newFolderRef.current?.focus(), 50);
  }, [newFolderMode]);

  async function loadAssets(folder?: string | null) {
    setLoadingAssets(true);
    const param = folder === undefined ? "" : folder === null ? "" : folder === "" ? "?folder=" : `?folder=${encodeURIComponent(folder)}`;
    const res = await fetch(`/api/portal/social/assets${param}`);
    const data = await res.json();
    setAssets(data.assets || []);
    // Merge API folders with any locally-created empty folders so they survive re-fetches
    setFolders((prev) => [...new Set([...prev, ...(data.folders || [])])].sort());
    setLoadingAssets(false);
  }

  // Reload when folder selection changes
  useEffect(() => {
    loadAssets(selectedFolder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolder]);

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (selectedFolder) formData.append("folder", selectedFolder);
    const res = await fetch("/api/portal/social/assets/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.asset) {
      setAssets((prev) => [data.asset, ...prev]);
      setSelectedAssetId(data.asset.id);
      // Add folder to list if new
      if (data.asset.folder && !folders.includes(data.asset.folder)) {
        setFolders((prev) => [...prev, data.asset.folder].sort());
      }
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

  async function moveToFolder(assetId: string, folder: string | null) {
    setMovingAsset(assetId);
    await fetch("/api/portal/social/assets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: assetId, folder }),
    });
    setMovingAsset(null);
    // Remove from current filtered view if it no longer belongs
    if (selectedFolder !== null) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } else {
      setAssets((prev) => prev.map((a) => a.id === assetId ? { ...a, folder } : a));
    }
    // Refresh folder list
    const res = await fetch("/api/portal/social/assets");
    const data = await res.json();
    setFolders(data.folders || []);
  }

  function createFolder() {
    const name = newFolderName.trim();
    if (!name || folders.includes(name)) { setNewFolderMode(false); setNewFolderName(""); return; }
    setFolders((prev) => [...prev, name].sort());
    setSelectedFolder(name);
    setNewFolderMode(false);
    setNewFolderName("");
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
    setDrafts((prev) => prev.map((p) => p.id === post.id ? { ...p, content: editContent } : p));
    setEditingId(null);
    setActionLoading(null);
  }

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const approvedDrafts = drafts.filter((d) => d.status === "approved");

  // Folder labels for the move popover
  const folderOptions: { label: string; value: string | null }[] = [
    { label: "Uncategorized", value: null },
    ...folders.map((f) => ({ label: f, value: f })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Post Studio</h1>
          <p className="text-text-muted text-[13px] mt-1">Upload photos, generate platform-specific posts with AI, and approve them for publishing.</p>
        </div>
        <Link href="/portal/social/posts"
          className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary transition-colors">
          View all posts <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Photo Library */}
        <div className="glass rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-text-primary">Photo Library</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors disabled:opacity-50">
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {uploading ? "Uploading..." : selectedFolder ? `Upload to ${selectedFolder}` : "Upload Photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            />
          </div>

          <div className="flex gap-3">
            {/* Folder sidebar */}
            <div className="w-36 flex-shrink-0 space-y-0.5">
              {/* All Photos */}
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${selectedFolder === null ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"}`}>
                <Images size={11} className="flex-shrink-0" /> All Photos
              </button>

              {/* Uncategorized */}
              <button
                onClick={() => setSelectedFolder("")}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${selectedFolder === "" ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"}`}>
                <ImageIcon size={11} className="flex-shrink-0" /> Uncategorized
              </button>

              {/* Named folders */}
              {folders.length > 0 && (
                <div className="pt-1.5 pb-0.5">
                  <p className="text-text-muted/40 text-[10px] font-semibold uppercase tracking-wider px-2 pb-1">Folders</p>
                  {folders.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFolder(f)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${selectedFolder === f ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary hover:bg-white/[0.04]"}`}>
                      {selectedFolder === f ? <FolderOpen size={11} className="flex-shrink-0" /> : <Folder size={11} className="flex-shrink-0" />}
                      <span className="truncate">{f}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* New Folder */}
              {newFolderMode ? (
                <div className="pt-1">
                  <input
                    ref={newFolderRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") { setNewFolderMode(false); setNewFolderName(""); } }}
                    onBlur={createFolder}
                    placeholder="Folder name..."
                    className="w-full px-2 py-1.5 rounded-lg bg-white/[0.06] border border-accent-blue/30 text-xs text-text-primary placeholder:text-text-muted/40 outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setNewFolderMode(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-text-muted/50 hover:text-text-muted hover:bg-white/[0.04] transition-colors mt-1">
                  <FolderPlus size={11} /> New Folder
                </button>
              )}
            </div>

            {/* Photo grid */}
            <div className="flex-1 min-w-0">
              {loadingAssets ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-text-muted/40" />
                </div>
              ) : assets.length === 0 ? (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl border border-dashed border-white/[0.10] hover:border-accent-blue/30 hover:bg-accent-blue/5 transition-colors text-text-muted/50 hover:text-text-muted">
                  <ImageIcon size={28} />
                  <div className="text-center">
                    <p className="text-xs font-medium">{selectedFolder ? `No photos in "${selectedFolder}"` : "Upload your first photo"}</p>
                    <p className="text-[11px] mt-0.5">PNG, JPG or WEBP up to 10MB</p>
                  </div>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {assets.map((asset) => (
                    <div key={asset.id} className="relative group">
                      <button
                        onClick={() => setSelectedAssetId(asset.id === selectedAssetId ? null : asset.id)}
                        className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selectedAssetId === asset.id
                            ? "border-accent-blue shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                            : "border-white/[0.06] hover:border-white/[0.15]"
                        }`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                        {selectedAssetId === asset.id && (
                          <div className="absolute inset-0 bg-accent-blue/20 flex items-center justify-center rounded-xl">
                            <div className="w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          </div>
                        )}
                      </button>

                      {/* Hover actions */}
                      <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Move to folder */}
                        <div className="relative">
                          <button
                            onClick={() => setMovingAsset(movingAsset === asset.id ? null : asset.id)}
                            title="Move to folder"
                            className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-accent-blue/80 transition-colors">
                            {movingAsset === asset.id ? <Loader2 size={10} className="text-white animate-spin" /> : <FolderInput size={10} className="text-white" />}
                          </button>
                          {/* Folder picker popover */}
                          {movingAsset === asset.id && (
                            <div className="absolute right-0 top-7 z-20 w-36 rounded-xl glass border border-white/[0.12] shadow-xl p-1 space-y-0.5">
                              {folderOptions.map((opt) => (
                                <button
                                  key={opt.value ?? "__none__"}
                                  onClick={() => { moveToFolder(asset.id, opt.value); setMovingAsset(null); }}
                                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${asset.folder === opt.value ? "text-accent-blue bg-accent-blue/10" : "text-text-muted hover:text-text-primary hover:bg-white/[0.06]"}`}>
                                  {opt.value ? <Folder size={10} /> : <ImageIcon size={10} />}
                                  {opt.label}
                                  {asset.folder === opt.value && <Check size={10} className="ml-auto" />}
                                </button>
                              ))}
                              {/* Move to new folder inline */}
                              <div className="border-t border-white/[0.06] pt-1 mt-1">
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const input = (e.currentTarget.elements.namedItem("fn") as HTMLInputElement).value.trim();
                                  if (!input) return;
                                  if (!folders.includes(input)) setFolders((prev) => [...prev, input].sort());
                                  moveToFolder(asset.id, input);
                                  setMovingAsset(null);
                                }}>
                                  <input
                                    name="fn"
                                    autoFocus
                                    placeholder="New folder..."
                                    className="w-full px-2 py-1 rounded-lg bg-white/[0.06] text-xs text-text-primary placeholder:text-text-muted/40 outline-none border border-white/[0.08] focus:border-accent-blue/30"
                                  />
                                </form>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDeleteAsset(asset, e)}
                          title="Delete"
                          className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80 transition-colors">
                          <Trash2 size={10} className="text-white" />
                        </button>
                      </div>

                      {/* Folder badge */}
                      {asset.folder && selectedFolder === null && (
                        <div className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/60 text-[9px] text-white/70 max-w-[90%]">
                          <Folder size={8} />
                          <span className="truncate">{asset.folder}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-blue text-white text-[13px] font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-60">
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
              <p className="text-text-muted text-[13px]">Generating content for Facebook, Instagram, LinkedIn and Twitter</p>
            </div>
          )}

          {!generating && drafts.length === 0 && (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-white/[0.08]">
              <Sparkles size={28} className="text-text-muted/20" />
              <p className="text-text-muted text-[13px]">Select a photo and click Generate Posts to get started</p>
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
                        <p className="text-text-muted text-[13px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
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
