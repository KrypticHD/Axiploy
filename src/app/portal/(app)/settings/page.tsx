"use client";

import { useState } from "react";
import { MOCK_USER } from "@/lib/mock-data";
import { Building2, Users, Bell, Shield, BarChart2, Monitor, CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-blue/50 transition-all duration-200";

type Tab = "profile" | "users" | "notifications" | "security" | "plan";

const NOTIF_DEFAULTS = [
  { key: "approvals", label: "Pending approvals", desc: "Notify when an action needs your approval", on: true },
  { key: "risk", label: "High-risk alerts", desc: "Notify immediately when a critical risk is flagged", on: true },
  { key: "weekly", label: "Weekly reports", desc: "Receive a weekly performance summary by email", on: true },
  { key: "complete", label: "Onboarding completions", desc: "Notify when an employee completes onboarding", on: false },
  { key: "workflow", label: "Workflow failures", desc: "Notify when an automated workflow encounters an error", on: true },
  { key: "digest", label: "Daily digest", desc: "Morning summary of yesterday's AI activity", on: false },
];

const SESSIONS = [
  { device: "Chrome · Windows 11", location: "London, UK", time: "Active now", current: true },
  { device: "Safari · iPhone 15", location: "London, UK", time: "2 hours ago", current: false },
];

const PLAN = {
  name: "Axiploy Pro",
  limits: [
    { label: "Digital Employees", used: 3, max: 5 },
    { label: "Users", used: 1, max: 10 },
    { label: "Onboarding records", used: 5, max: 100 },
    { label: "Tasks this month", used: 428, max: 2000 },
  ],
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_DEFAULTS.map((n) => [n.key, n.on]))
  );
  const [saved, setSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaved, setPwSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    setPwSaved(true);
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 3000);
  }

  const tabs: { key: Tab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { key: "profile", label: "Profile", icon: Building2 },
    { key: "users", label: "Users", icon: Users },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "plan", label: "Plan & Usage", icon: BarChart2 },
    { key: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-1">Manage your account and portal preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 glass rounded-xl border border-white/[0.06] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.key ? "bg-accent-blue text-white" : "text-text-muted hover:text-text-primary"
            }`}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === "profile" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Business Name</label>
              <input type="text" defaultValue={MOCK_USER.clientName} className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Contact Email</label>
              <input type="email" defaultValue={MOCK_USER.email} className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Industry</label>
              <input type="text" defaultValue="Construction" className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Phone</label>
              <input type="text" defaultValue="+44 7700 900000" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-text-muted text-xs mb-1.5 block">Business Address</label>
              <input type="text" defaultValue="14 Canary Wharf, London, E14 5AB" className={inputClass} />
            </div>
          </div>
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors">
            {saved ? <><CheckCircle2 size={14} /> Saved</> : "Save Changes"}
          </button>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="space-y-3">
            {[
              { name: MOCK_USER.name, email: MOCK_USER.email, role: "Client Admin", active: true },
              { name: "Coming Soon", email: "invite a team member", role: "Client Manager", active: false },
            ].map((u) => (
              <div key={u.email} className={`flex items-center justify-between p-4 rounded-xl border ${u.active ? "bg-white/[0.03] border-white/[0.05]" : "border-dashed border-white/[0.06] opacity-40"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-white text-xs font-bold">
                    {u.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{u.name}</p>
                    <p className="text-text-muted text-xs">{u.email}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">{u.role}</span>
              </div>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-white/[0.10] hover:border-white/20 text-text-muted text-sm font-medium transition-colors">
            + Invite User
          </button>
          <p className="text-xs text-text-muted/50">Role permissions: Client Admin = full access · Manager = no settings · Viewer = read only</p>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <p className="text-text-muted text-xs mb-2">Choose which events trigger notifications.</p>
          {NOTIF_DEFAULTS.map((n) => (
            <div key={n.key} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
              <div>
                <p className="text-text-primary text-sm">{n.label}</p>
                <p className="text-text-muted text-xs mt-0.5">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifs((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                className={`w-10 h-6 rounded-full border transition-colors flex-shrink-0 ${notifs[n.key] ? "bg-accent-blue border-accent-blue" : "bg-white/[0.04] border-white/[0.12]"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${notifs[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors">
            {saved ? <><CheckCircle2 size={14} /> Saved</> : "Save Preferences"}
          </button>
        </div>
      )}

      {/* Plan & Usage */}
      {tab === "plan" && (
        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-primary font-semibold">{PLAN.name}</p>
              <p className="text-text-muted text-xs mt-0.5">Renews monthly · managed by Axiploy</p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-medium">Active</span>
          </div>
          <div className="space-y-4">
            {PLAN.limits.map((l) => {
              const pct = Math.min(100, Math.round((l.used / l.max) * 100));
              return (
                <div key={l.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-text-muted text-xs">{l.label}</p>
                    <p className="text-text-primary text-xs font-medium">{l.used.toLocaleString()} / {l.max.toLocaleString()}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 80 ? "bg-amber-500" : "bg-accent-blue"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-white/[0.10] hover:border-accent-blue/30 hover:text-accent-blue text-text-muted text-sm font-medium transition-colors">
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="space-y-4">
          {/* Change password */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={16} className="text-accent-blue" />
              <h2 className="font-heading font-semibold text-text-primary text-sm">Change Password</h2>
            </div>
            {pwSaved ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle2 size={16} /> Password updated successfully
              </div>
            ) : (
              <form onSubmit={handlePwSave} className="space-y-3">
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">Current Password</label>
                  <input type="password" required value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} placeholder="••••••••" className={inputClass} />
                </div>
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">New Password</label>
                  <input type="password" required value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} placeholder="••••••••" className={inputClass} />
                </div>
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">Confirm New Password</label>
                  <input type="password" required value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" className={inputClass} />
                </div>
                <button type="submit" className="px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors">
                  Update Password
                </button>
              </form>
            )}
          </div>

          {/* Active sessions */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Monitor size={16} className="text-accent-blue" />
              <h2 className="font-heading font-semibold text-text-primary text-sm">Active Sessions</h2>
            </div>
            <div className="space-y-3">
              {SESSIONS.map((s) => (
                <div key={s.device} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                  <div>
                    <p className="text-text-primary text-sm">{s.device}</p>
                    <p className="text-text-muted text-xs mt-0.5">{s.location} · {s.time}</p>
                  </div>
                  {s.current ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Current</span>
                  ) : (
                    <button className="text-[10px] px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">Revoke</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* MFA */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-text-muted text-xs mt-0.5">Add an extra layer of security to your account</p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full glass border border-white/[0.10] text-text-muted">Coming Soon</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
