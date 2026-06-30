"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Bell, Shield, BarChart2, Monitor, CheckCircle2, AlertCircle } from "lucide-react";

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


export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_DEFAULTS.map((n) => [n.key, n.on]))
  );
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pwForm, setPwForm] = useState({ next: "", confirm: "" });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [planMetrics, setPlanMetrics] = useState<{ hoursSaved: number; tasksCompleted: number; activeOnboardings: number; actionsThisMonth: number } | null>(null);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => r.json())
      .then((d) => setProfileForm({ name: d.name || "", email: d.email || "" }));
    fetch("/api/portal/settings/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.preferences && Object.keys(d.preferences).length > 0) {
          setNotifs((prev) => ({ ...prev, ...d.preferences }));
        }
      })
      .catch(() => {});
    fetch("/api/portal/reports/metrics")
      .then((r) => r.json())
      .then((d) => setPlanMetrics(d))
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaveError("");
    const res = await fetch("/api/portal/settings/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      const d = await res.json();
      setSaveError(d.error || "Failed to save");
    }
  }

  async function handlePrefsSave() {
    await fetch("/api/portal/settings/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: notifs }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (pwForm.next !== pwForm.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    const res = await fetch("/api/portal/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: pwForm.next }),
    });
    if (res.ok) {
      setPwSaved(true);
      setPwForm({ next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 3000);
    } else {
      const d = await res.json();
      setPwError(d.error || "Failed to update password");
    }
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
              <label className="text-text-muted text-xs mb-1.5 block">Full Name</label>
              <input type="text" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Contact Email</label>
              <input type="email" value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
            </div>
          </div>
          {saveError && (
            <p className="flex items-center gap-1.5 text-red-400 text-xs"><AlertCircle size={12} />{saveError}</p>
          )}
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors">
            {saved ? <><CheckCircle2 size={14} /> Saved</> : "Save Changes"}
          </button>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-white text-xs font-bold">
                {(profileForm.name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-text-primary text-sm font-medium">{profileForm.name || "You"}</p>
                <p className="text-text-muted text-xs">{profileForm.email}</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">Client Admin</span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3">
            <Users size={15} className="text-accent-blue mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-text-primary text-sm font-medium">Need to add team members?</p>
              <p className="text-text-muted text-xs mt-0.5 mb-3">User management is handled by the Axiploy team. Contact us to add, remove, or adjust permissions for your team.</p>
              <a href="/portal/support" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/20 text-accent-blue text-xs font-medium transition-colors">
                Contact Axiploy to manage users
              </a>
            </div>
          </div>
          <p className="text-xs text-text-muted/50">Roles: Client Admin = full access · Manager = no settings · Viewer = read only</p>
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
          <button onClick={handlePrefsSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors">
            {saved ? <><CheckCircle2 size={14} /> Saved</> : "Save Preferences"}
          </button>
        </div>
      )}

      {/* Plan & Usage */}
      {tab === "plan" && (
        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-primary font-semibold">Axiploy Plan</p>
              <p className="text-text-muted text-xs mt-0.5">Managed by Axiploy · contact us to adjust</p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-medium">Active</span>
          </div>
          {planMetrics ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Hours Saved This Month", value: `${planMetrics.hoursSaved}h` },
                { label: "Tasks Completed", value: planMetrics.tasksCompleted.toLocaleString() },
                { label: "Active Onboardings", value: planMetrics.activeOnboardings.toLocaleString() },
                { label: "AI Actions This Month", value: planMetrics.actionsThisMonth.toLocaleString() },
              ].map((m) => (
                <div key={m.label} className="bg-white/[0.03] rounded-xl p-4 text-center">
                  <p className="font-heading font-bold text-text-primary text-xl">{m.value}</p>
                  <p className="text-text-muted text-[10px] mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-text-muted text-sm">Loading usage data…</div>
          )}
          <a href="/portal/support" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-white/[0.10] hover:border-accent-blue/30 hover:text-accent-blue text-text-muted text-sm font-medium transition-colors">
            Contact Axiploy to discuss your plan
          </a>
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
                  <label className="text-text-muted text-xs mb-1.5 block">New Password</label>
                  <input type="password" required value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} placeholder="••••••••" className={inputClass} />
                </div>
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">Confirm New Password</label>
                  <input type="password" required value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" className={inputClass} />
                </div>
                {pwError && (
                  <p className="flex items-center gap-1.5 text-red-400 text-xs"><AlertCircle size={12} />{pwError}</p>
                )}
                <button type="submit" className="px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors">
                  Update Password
                </button>
              </form>
            )}
          </div>

          {/* Active sessions */}
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Monitor size={16} className="text-accent-blue" />
              <h2 className="font-heading font-semibold text-text-primary text-sm">Active Sessions</h2>
              <span className="text-xs px-2.5 py-1 rounded-full glass border border-white/[0.10] text-text-muted ml-auto">Coming Soon</span>
            </div>
            <p className="text-text-muted text-xs">Session management will allow you to view and revoke active logins across devices.</p>
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
