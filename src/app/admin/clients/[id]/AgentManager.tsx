"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserCheck, ClipboardList, TrendingUp, Bot } from "lucide-react";

const AGENT_TEMPLATES = [
  { type: "onboarding", name: "AI Onboarding Assistant", description: "Automates employee onboarding — documents, forms, follow-ups.", icon: UserCheck },
  { type: "admin", name: "AI Admin Assistant", description: "Scheduling, reporting, data entry, communications.", icon: ClipboardList },
  { type: "growth", name: "AI Growth Assistant", description: "Lead follow-up, client engagement, pipeline management.", icon: TrendingUp },
];

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
}

export default function AgentManager({ clientId, agents }: { clientId: string; agents: Agent[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const assignedTypes = new Set(agents.map((a) => a.type));
  const available = AGENT_TEMPLATES.filter((t) => !assignedTypes.has(t.type));

  async function handleAdd() {
    if (!selectedType) return;
    setLoading(true);
    const template = AGENT_TEMPLATES.find((t) => t.type === selectedType)!;
    await fetch(`/api/admin/clients/${clientId}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: template.name, type: template.type }),
    });
    setAdding(false);
    setSelectedType("");
    setLoading(false);
    router.refresh();
  }

  async function handleRemove(agentId: string) {
    setRemovingId(agentId);
    await fetch(`/api/admin/clients/${clientId}/agents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
    setRemovingId(null);
    router.refresh();
  }

  const typeIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
    onboarding: UserCheck, admin: ClipboardList, growth: TrendingUp,
  };

  return (
    <div className="space-y-6">
      {/* Assigned agents */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-text-primary">Assigned AI Agents</h2>
          {available.length > 0 && (
            <button
              onClick={() => setAdding(!adding)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 transition-colors"
            >
              <Plus size={14} /> Add Agent
            </button>
          )}
        </div>

        {/* Add agent panel */}
        {adding && (
          <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <p className="text-text-muted text-xs font-medium">Select agent to assign:</p>
            <div className="grid gap-2">
              {available.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.type}
                    onClick={() => setSelectedType(t.type)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${selectedType === t.type ? "border-accent-blue/50 bg-accent-blue/10" : "border-white/[0.08] hover:bg-white/[0.04]"}`}
                  >
                    <Icon size={16} className="text-accent-cyan mt-0.5 shrink-0" />
                    <div>
                      <p className="text-text-primary text-sm font-medium">{t.name}</p>
                      <p className="text-text-muted text-xs mt-0.5">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAdd}
                disabled={!selectedType || loading}
                className="px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-light transition-colors disabled:opacity-50"
              >
                {loading ? "Assigning..." : "Assign Agent"}
              </button>
              <button
                onClick={() => { setAdding(false); setSelectedType(""); }}
                className="px-4 py-2 rounded-xl glass border border-white/[0.08] text-text-muted text-sm hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {agents.length === 0 ? (
          <div className="text-center py-8">
            <Bot size={24} className="text-text-muted/30 mx-auto mb-2" />
            <p className="text-text-muted text-sm">No agents assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => {
              const Icon = typeIcons[agent.type] || Bot;
              return (
                <div key={agent.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center">
                      <Icon size={16} className="text-accent-cyan" />
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{agent.name}</p>
                      <p className="text-text-muted text-xs capitalize">{agent.type} · {agent.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(agent.id)}
                    disabled={removingId === agent.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {removingId === agent.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
