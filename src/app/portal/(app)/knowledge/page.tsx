"use client";

import { useState } from "react";
import { BookOpen, Upload, FileText, File, Search, Download, Folder } from "lucide-react";

type Category = "All" | "Policies" | "SOPs" | "Forms" | "Contracts" | "Safety" | "Templates";

const CATEGORIES: Category[] = ["All", "Policies", "SOPs", "Forms", "Contracts", "Safety", "Templates"];

const DOCS = [
  { id: "1", name: "Employee Handbook 2024", category: "Policies", size: "2.4 MB", updatedAt: "2024-11-01", type: "pdf" },
  { id: "2", name: "Right to Work Verification SOP", category: "SOPs", size: "840 KB", updatedAt: "2024-10-15", type: "pdf" },
  { id: "3", name: "New Starter Induction SOP", category: "SOPs", size: "1.1 MB", updatedAt: "2024-10-20", type: "pdf" },
  { id: "4", name: "P45 / P60 Request Form", category: "Forms", size: "120 KB", updatedAt: "2024-09-05", type: "docx" },
  { id: "5", name: "Employment Contract Template", category: "Contracts", size: "310 KB", updatedAt: "2024-11-10", type: "docx" },
  { id: "6", name: "Zero Hours Contract Template", category: "Contracts", size: "290 KB", updatedAt: "2024-10-30", type: "docx" },
  { id: "7", name: "Health & Safety Policy", category: "Safety", size: "1.8 MB", updatedAt: "2024-08-12", type: "pdf" },
  { id: "8", name: "COSHH Assessment Form", category: "Safety", size: "220 KB", updatedAt: "2024-09-18", type: "pdf" },
  { id: "9", name: "Onboarding Document Checklist", category: "Templates", size: "95 KB", updatedAt: "2024-11-05", type: "xlsx" },
  { id: "10", name: "Welcome Email Template", category: "Templates", size: "48 KB", updatedAt: "2024-10-22", type: "docx" },
  { id: "11", name: "GDPR Data Processing Policy", category: "Policies", size: "670 KB", updatedAt: "2024-07-30", type: "pdf" },
  { id: "12", name: "Annual Leave Request Form", category: "Forms", size: "88 KB", updatedAt: "2024-09-01", type: "pdf" },
];

const TYPE_COLOUR: Record<string, string> = {
  pdf: "text-red-400 bg-red-500/10",
  docx: "text-accent-blue bg-accent-blue/10",
  xlsx: "text-emerald-400 bg-emerald-500/10",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function KnowledgePage() {
  const [cat, setCat] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const filtered = DOCS.filter(
    (d) =>
      (cat === "All" || d.category === cat) &&
      d.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleUpload() {
    setUploading(true);
    setTimeout(() => setUploading(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Knowledge Base</h1>
          <p className="text-text-muted text-sm mt-1">
            Policies, SOPs, forms, contracts and templates — accessible to your AI workforce.
          </p>
        </div>
        <button
          onClick={handleUpload}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          {uploading ? (
            <span className="animate-pulse">Uploading…</span>
          ) : (
            <><Upload size={14} /> Upload Document</>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total documents", value: DOCS.length, icon: FileText },
          { label: "Policies", value: DOCS.filter((d) => d.category === "Policies").length, icon: BookOpen },
          { label: "Forms", value: DOCS.filter((d) => d.category === "Forms").length, icon: File },
          { label: "Templates", value: DOCS.filter((d) => d.category === "Templates").length, icon: Folder },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-white/[0.06] p-4">
            <s.icon size={16} className="text-accent-blue mb-2" />
            <p className="font-heading font-bold text-xl text-text-primary">{s.value}</p>
            <p className="text-text-muted text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" />
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent-blue/50 transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 glass rounded-xl border border-white/[0.06] overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                cat === c ? "bg-accent-blue text-white" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-text-muted/50 uppercase tracking-wider">
          <div className="col-span-5">Document</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-1" />
        </div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-text-muted text-sm">No documents found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((d) => (
              <div key={d.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <FileText size={14} className="text-text-muted/50 flex-shrink-0" />
                  <p className="text-text-primary text-sm truncate">{d.name}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-text-muted">{d.category}</span>
                </div>
                <div className="col-span-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase ${TYPE_COLOUR[d.type] ?? "text-text-muted bg-white/[0.04]"}`}>
                    {d.type}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-text-muted">{fmt(d.updatedAt)}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button className="p-1.5 rounded-lg text-text-muted/50 hover:text-text-primary hover:bg-white/[0.06] transition-colors">
                    <Download size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted/50 text-center">
        Documents uploaded here are made available to your Digital Employees for reference and generation tasks.
      </p>
    </div>
  );
}
