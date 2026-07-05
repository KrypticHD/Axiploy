"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2, UserCheck, Truck, HardHat } from "lucide-react";
import type { ProjectTask } from "./page";

interface StaffOption { id: string; employee_name: string }
interface EquipmentOption { id: string; name: string }

const RESOURCE_ICON: Record<string, React.ElementType> = {
  staff: UserCheck, equipment: Truck, subcontractor: HardHat,
};

export default function AssignResourcePanel({ task, onChange }: { task: ProjectTask; onChange: () => void }) {
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [resourceType, setResourceType] = useState<"staff" | "equipment" | "subcontractor">("staff");
  const [staffId, setStaffId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [subcontractorName, setSubcontractorName] = useState("");
  const [startDate, setStartDate] = useState(task.start_date);
  const [endDate, setEndDate] = useState(task.end_date);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/portal/staff").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.staff) setStaffOptions(d.staff); });
    fetch("/api/portal/scheduler/equipment").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.equipment) setEquipmentOptions(d.equipment); });
  }, []);

  function resetForm() {
    setStaffId(""); setEquipmentId(""); setSubcontractorName("");
    setStartDate(task.start_date); setEndDate(task.end_date);
    setWarnings([]);
  }

  async function handleAssign() {
    let resourceName = "";
    if (resourceType === "staff") resourceName = staffOptions.find((s) => s.id === staffId)?.employee_name || "";
    if (resourceType === "equipment") resourceName = equipmentOptions.find((e) => e.id === equipmentId)?.name || "";
    if (resourceType === "subcontractor") resourceName = subcontractorName.trim();

    if (!resourceName) return;

    setSaving(true);
    const res = await fetch("/api/portal/scheduler/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: task.id,
        resource_type: resourceType,
        staff_id: resourceType === "staff" ? staffId : null,
        equipment_id: resourceType === "equipment" ? equipmentId : null,
        resource_name: resourceName,
        start_date: startDate,
        end_date: endDate,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (data.warnings?.length) {
      setWarnings(data.warnings);
      // Still saved (warn-but-allow) — refresh parent and close after a beat so the warning is visible
      onChange();
      setTimeout(() => { setShowAssign(false); resetForm(); }, 2500);
    } else {
      setShowAssign(false);
      resetForm();
      onChange();
    }
  }

  async function removeAssignment(id: string) {
    await fetch("/api/portal/scheduler/assignments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  return (
    <div className="space-y-3">
      {task.assignments.length > 0 && (
        <div className="space-y-1.5">
          {task.assignments.map((a) => {
            const Icon = RESOURCE_ICON[a.resource_type] || UserCheck;
            return (
              <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <Icon size={13} className="text-accent-cyan shrink-0" />
                <span className="text-[12px] text-text-primary flex-1">{a.resource_name}</span>
                <span className="text-[11px] text-text-muted shrink-0">
                  {new Date(a.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  {" – "}
                  {new Date(a.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </span>
                <button onClick={() => removeAssignment(a.id)} className="text-text-muted hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-2.5 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-[11px] text-amber-400 flex items-start gap-1.5">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {w}
            </p>
          ))}
        </div>
      )}

      {showAssign ? (
        <div className="glass rounded-lg border border-accent-blue/20 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5">
            {(["staff", "equipment", "subcontractor"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setResourceType(type)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${resourceType === type ? "bg-accent-blue/20 text-accent-blue" : "text-text-muted hover:text-text-primary"}`}
              >
                {type}
              </button>
            ))}
          </div>

          {resourceType === "staff" && (
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full bg-[#1c1c2e] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none">
              <option value="">Select staff member…</option>
              {staffOptions.map((s) => <option key={s.id} value={s.id}>{s.employee_name}</option>)}
            </select>
          )}
          {resourceType === "equipment" && (
            <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="w-full bg-[#1c1c2e] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none">
              <option value="">Select equipment…</option>
              {equipmentOptions.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          )}
          {resourceType === "subcontractor" && (
            <input
              value={subcontractorName} onChange={(e) => setSubcontractorName(e.target.value)}
              placeholder="Subcontractor/crew name" className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-accent-blue/40"
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#1c1c2e] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none [color-scheme:dark]" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[#1c1c2e] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none [color-scheme:dark]" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleAssign} disabled={saving} className="px-3 py-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue-light text-white text-[12px] font-medium transition-colors disabled:opacity-50">
              {saving ? "Assigning…" : "Assign"}
            </button>
            <button onClick={() => { setShowAssign(false); resetForm(); }} className="px-3 py-1.5 rounded-lg glass border border-white/[0.08] text-text-muted text-[12px]">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAssign(true)} className="inline-flex items-center gap-1.5 text-[12px] text-accent-cyan hover:text-accent-blue transition-colors">
          <Plus size={12} /> Assign resource
        </button>
      )}
    </div>
  );
}
