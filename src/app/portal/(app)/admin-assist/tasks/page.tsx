"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Trash2, Loader2, AlertTriangle, Clock, ChevronDown } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date?: string;
  created_at: string;
  completed_at?: string;
}

const PRIORITY_STYLE: Record<string, string> = {
  urgent: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  low: "text-text-muted bg-white/[0.05] border-white/[0.08]",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "text-text-muted",
  in_progress: "text-accent-blue",
  completed: "text-emerald-400",
  cancelled: "text-text-muted/40 line-through",
};

function isOverdue(task: Task) {
  return task.due_date && task.status !== "completed" && task.status !== "cancelled" && new Date(task.due_date) < new Date();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [showAdd, setShowAdd] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/portal/admin-assist/tasks")
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/portal/admin-assist/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.task) {
      setTasks((prev) => [data.task, ...prev]);
      setForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
      setShowAdd(false);
    }
  }

  async function handleStatus(id: string, status: string) {
    setActionLoading(id);
    await fetch("/api/portal/admin-assist/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}) }),
    });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: status as Task["status"] } : t));
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    await fetch("/api/portal/admin-assist/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setActionLoading(null);
  }

  const active = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completed = tasks.filter((t) => t.status === "completed" || t.status === "cancelled");
  const displayed = tab === "active" ? active : completed;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Tasks</h1>
          <p className="text-text-muted text-[13px] mt-1">Create, assign and track tasks across your team.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[13px] font-medium hover:bg-accent-blue/20 transition-colors">
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="glass rounded-xl p-4 border border-accent-blue/20 space-y-4">
          <p className="text-[13px] font-semibold text-text-primary">New Task</p>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Task title..." autoFocus
            className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.10] rounded-xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)..." rows={2}
            className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.10] rounded-xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40 resize-none" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Assign to</label>
              <input value={form.assigned_to} onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                placeholder="Name..." className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#1c1c2e] border border-white/[0.10] rounded-lg text-white focus:outline-none focus:border-accent-blue/40">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Due date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary focus:outline-none focus:border-accent-blue/40" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!form.title.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue text-white text-[13px] font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Adding..." : "Add Task"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl glass border border-white/[0.08] text-text-muted text-[13px] hover:bg-white/[0.06] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl glass border border-white/[0.06] w-fit">
        {(["active", "completed"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors capitalize ${tab === t ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary"}`}>
            {t === "active" ? "Active" : "Completed"}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t ? "bg-accent-blue/30 text-accent-blue" : "bg-white/[0.08] text-text-muted"}`}>
              {t === "active" ? active.length : completed.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-text-muted/40" /></div>
      ) : displayed.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-dashed border-white/[0.08]">
          <p className="text-text-muted text-[13px]">{tab === "active" ? "No active tasks — add one above" : "No completed tasks yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((task) => (
            <div key={task.id} className={`glass rounded-xl p-4 border transition-colors ${isOverdue(task) ? "border-red-500/20" : "border-white/[0.06]"}`}>
              <div className="flex items-start gap-3">
                {tab === "active" && (
                  <button onClick={() => handleStatus(task.id, task.status === "in_progress" ? "pending" : task.status === "pending" ? "in_progress" : "completed")}
                    disabled={actionLoading === task.id}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${task.status === "completed" ? "bg-emerald-500 border-emerald-500" : task.status === "in_progress" ? "border-accent-blue" : "border-white/[0.20] hover:border-accent-blue"}`}>
                    {task.status === "completed" && <Check size={11} className="text-white" />}
                    {task.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-accent-blue" />}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-[13px] font-medium ${STATUS_STYLE[task.status]}`}>{task.title}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
                    {isOverdue(task) && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertTriangle size={10} /> Overdue</span>}
                  </div>
                  {task.description && <p className="text-text-muted text-xs mt-1">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    {task.assigned_to && <p className="text-text-muted/50 text-[10px]">→ {task.assigned_to}</p>}
                    {task.due_date && (
                      <p className={`text-[10px] flex items-center gap-1 ${isOverdue(task) ? "text-red-400" : "text-text-muted/50"}`}>
                        <Clock size={9} /> {new Date(task.due_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {tab === "active" && (
                    <button onClick={() => handleStatus(task.id, "completed")} disabled={actionLoading === task.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors">
                      <Check size={11} /> Done
                    </button>
                  )}
                  <button onClick={() => handleDelete(task.id)} disabled={actionLoading === task.id}
                    className="p-1.5 rounded-lg text-text-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
