"use client";

import { useState, useEffect } from "react";
import { BookOpen, Upload, Download, Trash2, Search, FileText, File, Image, Table, Pencil, Check, X } from "lucide-react";

interface KnowledgeDoc {
  id: string;
  name: string;
  category: string;
  file_type: string;
  file_size_kb: number;
  created_at: string;
}

const CATEGORIES = ["All", "Policies", "SOPs", "Forms", "Contracts", "Safety", "Templates"];

const FILE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  PDF: FileText, DOCX: File, DOC: File, XLSX: Table, XLS: Table, PNG: Image, JPG: Image,
};

function fmt(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function DocRow({ doc, onDelete, onUpdate }: {
  doc: KnowledgeDoc;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, category: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(doc.name);
  const [category, setCategory] = useState(doc.category);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/portal/knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.id, name, category }),
    });
    if (res.ok) {
      onUpdate(doc.id, name, category);
      setEditing(false);
    }
    setSaving(false);
  }

  function handleCancel() {
    setName(doc.name);
    setCategory(doc.category);
    setEditing(false);
  }

  const Icon = FILE_ICONS[doc.file_type] || File;

  return (
    <div className="glass rounded-xl border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-accent-blue" />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white/[0.06] border border-accent-blue/30 rounded-lg text-text-primary focus:outline-none"
                autoFocus
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white/[0.06] border border-white/[0.12] rounded-lg text-text-muted [color-scheme:dark]"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <p className="text-text-primary text-[13px] font-medium truncate">{doc.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-muted">{doc.category}</span>
                <span className="text-[10px] text-text-muted/50">{doc.file_type}</span>
                {doc.file_size_kb > 0 && <span className="text-[10px] text-text-muted/50">{fmt(doc.file_size_kb)}</span>}
                <span className="text-[10px] text-text-muted/40">
                  {new Date(doc.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg text-text-muted hover:bg-white/[0.06] transition-colors"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                title="Rename / change category"
              >
                <Pencil size={14} />
              </button>
              <a
                href={`/api/portal/knowledge/download/${doc.id}`}
                className="p-2 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
                title="Download"
              >
                <Download size={14} />
              </a>
              <button
                onClick={() => onDelete(doc.id)}
                className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [uploadCategory, setUploadCategory] = useState("Policies");

  useEffect(() => {
    fetch("/api/portal/knowledge")
      .then((r) => r.json())
      .then((d) => setDocs(d.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");

    const form = new FormData();
    form.append("file", file);
    form.append("category", uploadCategory);

    try {
      const res = await fetch("/api/portal/knowledge/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || "Upload failed"); return; }
      setDocs((prev) => [data.document, ...prev]);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    const res = await fetch("/api/portal/knowledge", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function handleUpdate(id: string, name: string, category: string) {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, name, category } : d));
  }

  const filtered = docs.filter((d) => {
    const matchCat = category === "All" || d.category === category;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Knowledge Base</h1>
          <p className="text-text-muted text-[13px] mt-1">Upload and manage documents for your AI workforce.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="text-xs text-text-muted bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 [color-scheme:dark]"
          >
            {CATEGORIES.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/20 text-accent-blue text-[13px] font-medium transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload size={14} />
            {uploading ? "Uploading…" : "Upload Document"}
            <input
              type="file"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {uploadError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === c
                  ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
                  : "text-text-muted border border-white/[0.08] hover:border-white/20"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-text-muted text-[13px]">Loading documents…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/[0.06]">
          <BookOpen size={28} className="text-text-muted/30 mx-auto mb-3" />
          {docs.length === 0 ? (
            <>
              <p className="text-text-primary text-[13px] font-medium">No documents yet</p>
              <p className="text-text-muted text-xs mt-1">Upload your first document using the button above.</p>
            </>
          ) : (
            <p className="text-text-muted text-[13px]">No documents match your search.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <DocRow key={doc.id} doc={doc} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
