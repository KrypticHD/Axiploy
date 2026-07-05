"use client";

const AGENT_STYLES: Record<string, { short: string; gradient: string; label: string }> = {
  admin: { short: "AD", gradient: "from-accent-blue to-accent-cyan", label: "AI Admin" },
  onboarding: { short: "ON", gradient: "from-accent-cyan to-emerald-400", label: "AI Onboarding" },
  social: { short: "SO", gradient: "from-fuchsia-400 to-accent-blue", label: "AI Social" },
  growth: { short: "GR", gradient: "from-indigo-400 to-accent-cyan", label: "AI Growth" },
  compliance: { short: "CO", gradient: "from-amber-400 to-red-400", label: "AI Compliance" },
  safety: { short: "SF", gradient: "from-red-400 to-amber-400", label: "AI Safety" },
};

const FALLBACK = { short: "AI", gradient: "from-accent-blue to-accent-cyan", label: "AI Employee" };

export function agentLabel(type: string): string {
  return (AGENT_STYLES[type] || FALLBACK).label;
}

export default function AgentAvatar({
  type,
  size = 24,
  working = false,
}: {
  type: string;
  size?: number;
  working?: boolean;
}) {
  const style = AGENT_STYLES[type] || FALLBACK;
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br ${style.gradient} text-white font-semibold shrink-0 select-none`}
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.36) }}
      title={style.label}
    >
      {style.short}
      {working && (
        <span
          className="absolute rounded-full bg-emerald-400 border border-base animate-pulse"
          style={{ width: size * 0.32, height: size * 0.32, bottom: -1, right: -1 }}
        />
      )}
    </span>
  );
}
