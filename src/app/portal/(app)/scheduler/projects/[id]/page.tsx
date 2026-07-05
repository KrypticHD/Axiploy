"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusPill from "@/components/portal/StatusPill";
import { ArrowLeft, MapPin, DollarSign, User, Calendar, ListTodo, FileText } from "lucide-react";
import TaskList from "./TaskList";
import DocumentsTab from "./DocumentsTab";

interface Project {
  id: string;
  name: string;
  site_location: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
}

export interface TaskAssignment {
  id: string;
  resource_type: "staff" | "equipment" | "subcontractor";
  resource_name: string;
  start_date: string;
  end_date: string;
}

export interface ProjectTask {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string | null;
  assignments: TaskAssignment[];
}

const STATUS_OPTIONS = ["planning", "active", "on_hold", "complete", "cancelled"];

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [documents, setDocuments] = useState<{ id: string; name: string; file_url: string; file_type: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tasks" | "documents">("tasks");

  function load() {
    fetch(`/api/portal/scheduler/projects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setProject(d.project);
        setTasks(d.tasks || []);
        setDocuments(d.documents || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: string) {
    await fetch(`/api/portal/scheduler/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) return <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Loading…</p></div>;
  if (!project) return <div className="glass rounded-xl border border-white/[0.06] p-8 text-center"><p className="text-text-muted text-[13px]">Project not found.</p></div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/portal/scheduler/projects" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-[13px] transition-colors">
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      <div className="glass rounded-xl border border-white/[0.06] p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-heading text-lg font-bold text-text-primary">{project.name}</h1>
            {project.site_location && (
              <p className="text-text-muted text-[13px] flex items-center gap-1.5 mt-1">
                <MapPin size={12} /> {project.site_location}
              </p>
            )}
          </div>
          <select
            value={project.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-accent-blue/50 capitalize"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-[12px]">
          <div className="flex items-center gap-2 text-text-muted">
            <Calendar size={13} className="text-text-muted/50" />
            {project.start_date ? new Date(project.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            {" → "}
            {project.end_date ? new Date(project.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </div>
          {project.budget != null && (
            <div className="flex items-center gap-2 text-text-muted">
              <DollarSign size={13} className="text-text-muted/50" />
              ${Number(project.budget).toLocaleString("en-AU")}
            </div>
          )}
          {project.contact_name && (
            <div className="flex items-center gap-2 text-text-muted">
              <User size={13} className="text-text-muted/50" />
              {project.contact_name}
            </div>
          )}
        </div>

        {project.notes && (
          <p className="text-text-muted text-[12px] mt-4 pt-4 border-t border-white/[0.06] leading-relaxed">{project.notes}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        <button
          onClick={() => setTab("tasks")}
          className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${tab === "tasks" ? "border-accent-blue text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
        >
          <ListTodo size={13} /> Tasks
        </button>
        <button
          onClick={() => setTab("documents")}
          className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${tab === "documents" ? "border-accent-blue text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
        >
          <FileText size={13} /> Documents
        </button>
      </div>

      {tab === "tasks" && (
        <TaskList projectId={id} projectStart={project.start_date} projectEnd={project.end_date} tasks={tasks} onChange={load} />
      )}
      {tab === "documents" && (
        <DocumentsTab projectId={id} documents={documents} onChange={load} />
      )}
    </div>
  );
}
