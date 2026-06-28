"use client";

const PROMPTS = [
  "What has my AI workforce achieved today?",
  "Show me today's onboarding progress",
  "Which employees are high risk?",
  "Generate this week's report",
  "How much time have we saved this month?",
  "Show overdue documents",
  "Which AI employee is currently busiest?",
  "What should I focus on today?",
];

interface Props {
  onSelect: (prompt: string) => void;
}

export default function SuggestedPrompts({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {PROMPTS.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          className="text-left px-4 py-3 rounded-xl glass border border-white/[0.08] hover:border-accent-blue/30 hover:bg-accent-blue/5 text-sm text-text-muted hover:text-text-primary transition-all duration-200"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
