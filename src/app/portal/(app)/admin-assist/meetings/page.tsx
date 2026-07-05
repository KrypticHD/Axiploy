"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Clock, MapPin, Users } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  attendees?: string[];
  start_time: string;
  end_time?: string;
  location?: string;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) + " at " + d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

function isPast(iso: string) { return new Date(iso) < new Date(); }
function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", attendees: "", start_time: "", end_time: "", location: "" });

  useEffect(() => {
    fetch("/api/portal/admin-assist/meetings")
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.title.trim() || !form.start_time) return;
    setSaving(true);
    const attendees = form.attendees ? form.attendees.split(",").map((a) => a.trim()).filter(Boolean) : [];
    const res = await fetch("/api/portal/admin-assist/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, attendees }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.meeting) {
      setMeetings((prev) => [...prev, data.meeting].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      setForm({ title: "", description: "", attendees: "", start_time: "", end_time: "", location: "" });
      setShowAdd(false);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    await fetch("/api/portal/admin-assist/meetings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    setActionLoading(null);
  }

  async function handleComplete(id: string) {
    setActionLoading(id);
    await fetch("/api/portal/admin-assist/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    });
    setMeetings((prev) => prev.map((m) => m.id === id ? { ...m, status: "completed" as const } : m));
    setActionLoading(null);
  }

  const upcoming = meetings.filter((m) => m.status === "scheduled" && !isPast(m.start_time));
  const past = meetings.filter((m) => m.status === "completed" || (m.status === "scheduled" && isPast(m.start_time)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-text-primary">Meetings</h1>
          <p className="text-text-muted text-[13px] mt-1">Schedule and track your meetings and reminders.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[13px] font-medium hover:bg-accent-blue/20 transition-colors">
          <Plus size={14} /> Schedule Meeting
        </button>
      </div>

      {showAdd && (
        <div className="glass rounded-xl p-4 border border-accent-blue/20 space-y-4">
          <p className="text-[13px] font-semibold text-text-primary">New Meeting</p>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Meeting title..." autoFocus
            className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.10] rounded-xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Start time</label>
              <input type="datetime-local" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">End time</label>
              <input type="datetime-local" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary focus:outline-none focus:border-accent-blue/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Location / Link</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Office / Teams / Zoom..." className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Attendees (comma separated)</label>
              <input value={form.attendees} onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
                placeholder="John, Sarah, Mike..." className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.10] rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40" />
            </div>
          </div>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Agenda / notes (optional)..." rows={2}
            className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.10] rounded-xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-blue/40 resize-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!form.title.trim() || !form.start_time || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue text-white text-[13px] font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Saving..." : "Schedule"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl glass border border-white/[0.08] text-text-muted text-[13px] hover:bg-white/[0.06] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-text-muted/40" /></div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          <div>
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</p>
            {upcoming.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-dashed border-white/[0.08]">
                <p className="text-text-muted/50 text-sm">No upcoming meetings — schedule one above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((m) => (
                  <div key={m.id} className={`glass rounded-xl p-4 border ${isToday(m.start_time) ? "border-accent-blue/25 bg-accent-blue/[0.03]" : "border-white/[0.06]"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isToday(m.start_time) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue font-semibold">Today</span>}
                          <p className="text-text-primary text-[13px] font-medium truncate">{m.title}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-text-muted text-xs flex items-center gap-1"><Clock size={11} /> {formatDateTime(m.start_time)}</p>
                          {m.location && <p className="text-text-muted text-xs flex items-center gap-1"><MapPin size={11} /> {m.location}</p>}
                          {m.attendees && m.attendees.length > 0 && <p className="text-text-muted text-xs flex items-center gap-1"><Users size={11} /> {m.attendees.join(", ")}</p>}
                        </div>
                        {m.description && <p className="text-text-muted/60 text-xs mt-1.5 line-clamp-2">{m.description}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => handleComplete(m.id)} disabled={actionLoading === m.id}
                          className="px-2.5 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted text-xs hover:text-emerald-400 hover:border-emerald-500/20 transition-colors">
                          Mark done
                        </button>
                        <button onClick={() => handleDelete(m.id)} disabled={actionLoading === m.id}
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

          {/* Past */}
          {past.length > 0 && (
            <div>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Past ({past.length})</p>
              <div className="space-y-2">
                {past.slice(0, 5).map((m) => (
                  <div key={m.id} className="glass rounded-xl p-4 border border-white/[0.04] opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-text-muted text-[13px]">{m.title}</p>
                        <p className="text-text-muted/50 text-xs mt-0.5">{formatDateTime(m.start_time)}</p>
                      </div>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg text-text-muted/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
