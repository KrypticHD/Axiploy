"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusPill from "@/components/portal/StatusPill";
import { FolderKanban, Plus, MapPin, ChevronRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  site_location: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/scheduler/projects")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.projects) setProjects(d.projects); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
            <FolderKanban size={19} className="text-accent-cyan" />
            Projects
          </h1>
          <p className="text-text-muted text-[13px] mt-1">Every job, its dates, and its budget in one place.</p>
        </div>
        <Link href="/portal/scheduler/projects/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue hover:bg-accent-blue-light text-white text-[13px] font-medium transition-colors shrink-0">
          <Plus size={14} /> New Project
        </Link>
      </div>

      {loading ? (
        <div className="glass rounded-xl border border-white/[0.06] p-8 text-center">
          <p className="text-text-muted text-[13px]">Loading…</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-xl border border-white/[0.06] p-10 text-center">
          <FolderKanban size={26} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-primary text-sm font-medium">No projects yet</p>
          <p className="text-text-muted text-[12px] mt-1 mb-4">Create your first project to start scheduling tasks and resources.</p>
          <Link href="/portal/scheduler/projects/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[12px] font-medium hover:bg-accent-blue/20 transition-colors">
            <Plus size={12} /> New Project
          </Link>
        </div>
      ) : (
        <div className="glass rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
          {projects.map((p) => (
            <Link key={p.id} href={`/portal/scheduler/projects/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-text-primary text-[13px] font-medium truncate">{p.name}</p>
                {p.site_location && (
                  <p className="text-text-muted text-[11px] flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {p.site_location}
                  </p>
                )}
              </div>
              <div className="text-[11px] text-text-muted shrink-0 hidden sm:block">
                {p.start_date ? new Date(p.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—"}
                {" → "}
                {p.end_date ? new Date(p.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—"}
              </div>
              {p.budget != null && (
                <div className="text-[12px] text-text-primary shrink-0 hidden md:block">
                  ${Number(p.budget).toLocaleString("en-AU")}
                </div>
              )}
              <StatusPill status={p.status} size="sm" />
              <ChevronRight size={14} className="text-text-muted/40 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
