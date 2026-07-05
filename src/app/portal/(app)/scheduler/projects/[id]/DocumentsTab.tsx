"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Trash2, Download } from "lucide-react";

interface ProjectDocument {
  id: string;
  name: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

export default function DocumentsTab({
  projectId, documents, onChange,
}: {
  projectId: string;
  documents: ProjectDocument[];
  onChange: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", projectId);

    try {
      const res = await fetch("/api/portal/scheduler/documents", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    await fetch("/api/portal/scheduler/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[12px] font-medium hover:bg-accent-blue/20 transition-colors disabled:opacity-50"
        >
          <Upload size={12} /> {uploading ? "Uploading…" : "Upload Document"}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
      </div>

      {error && <p className="text-red-400 text-[12px] text-right">{error}</p>}

      {documents.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-8 text-center">
          <FileText size={22} className="text-text-muted/30 mx-auto mb-2" />
          <p className="text-text-muted text-[13px]">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-2.5">
              <FileText size={14} className="text-accent-cyan shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-text-primary truncate">{doc.name}</p>
                <p className="text-[11px] text-text-muted">{doc.file_type} · {new Date(doc.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-text-muted hover:text-accent-cyan transition-colors">
                <Download size={13} />
              </a>
              <button onClick={() => handleDelete(doc.id)} className="text-text-muted hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
