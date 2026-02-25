"use client";
import { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertTriangle, Wrench, RefreshCw, Plus, ChevronDown, X, Check, User } from "lucide-react";
import api from "@/lib/api";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "INSPECTED" | "VERIFIED";
type TaskType = "CHECKOUT_CLEANING" | "STAYOVER" | "ARRIVAL_PREP" | "MAINTENANCE" | "DEEP_CLEAN" | "TURNDOWN" | "INSPECTION";
type Priority = "HIGH" | "NORMAL" | "LOW";

interface HKTask {
  id: string; room: string; floor: number; roomType: string;
  type: TaskType; status: TaskStatus; priority: Priority;
  assignedTo: string | null; notes?: string;
  startedAt?: string; completedAt?: string;
}

const TYPE_CFG: Record<string, { label: string; emoji: string; color: string }> = {
  CHECKOUT_CLEANING: { label: "Checkout",     emoji: "🚪", color: "#EF4444" },
  STAYOVER:          { label: "Stayover",      emoji: "🔄", color: "#3B82F6" },
  ARRIVAL_PREP:      { label: "Arrival Prep",  emoji: "✨", color: "#10B981" },
  MAINTENANCE:       { label: "Maintenance",   emoji: "🔧", color: "#F59E0B" },
  DEEP_CLEAN:        { label: "Deep Clean",    emoji: "🧹", color: "#8B5CF6" },
  TURNDOWN:          { label: "Turndown",      emoji: "🌙", color: "#6366F1" },
  INSPECTION:        { label: "Inspection",    emoji: "🔍", color: "#0EA5E9" },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label: "Pending",     color: "#94A3B8", bg: "#F8FAFC" },
  IN_PROGRESS: { label: "Cleaning",    color: "#F59E0B", bg: "#FFFBEB" },
  COMPLETED:   { label: "Done",        color: "#3B82F6", bg: "#EFF6FF" },
  INSPECTED:   { label: "Inspected",   color: "#10B981", bg: "#ECFDF5" },
  VERIFIED:    { label: "Verified",    color: "#10B981", bg: "#ECFDF5" },
};

const ATTENDANTS = [
  { id: "a1", name: "Maria L.", tasks: 3 },
  { id: "a2", name: "Carlos M.", tasks: 4 },
  { id: "a3", name: "Ana P.", tasks: 2 },
  { id: "a4", name: "James T.", tasks: 5 },
];

function mapTask(raw: any): HKTask {
  const room = raw.room ?? {};
  const roomNumber = typeof room === "string" ? room : (room.number ?? room.roomNumber ?? raw.roomNumber ?? raw.room ?? "");
  const roomType = typeof room === "object" ? (room.roomType?.name ?? room.type?.name ?? room.typeName ?? "") : (raw.roomType ?? "");
  const floorNum = raw.floor ?? room.floor ?? (roomNumber ? parseInt(String(roomNumber).charAt(0), 10) || 1 : 1);
  const assignee = raw.assignedTo ?? raw.assignee ?? null;
  const assignedName = typeof assignee === "object" && assignee !== null
    ? `${assignee.firstName ?? ""} ${assignee.lastName ?? ""}`.trim()
    : assignee;

  return {
    id: raw.id,
    room: String(roomNumber),
    floor: floorNum,
    roomType: String(roomType),
    type: (raw.type ?? raw.taskType ?? "STAYOVER") as TaskType,
    status: (raw.status ?? "PENDING") as TaskStatus,
    priority: (raw.priority ?? "NORMAL") as Priority,
    assignedTo: assignedName || null,
    notes: raw.notes,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
  };
}

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"board" | "list" | "maintenance">("board");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});
  const [assignModal, setAssignModal] = useState<HKTask | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.housekeeping.list()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data.tasks ?? data.items ?? data.data ?? []);
        const mapped = list.map(mapTask);
        setTasks(mapped);
        // Auto-expand all floors
        const floorMap: Record<number, boolean> = {};
        mapped.forEach((t: HKTask) => { floorMap[t.floor] = true; });
        setExpandedFloors(floorMap);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load housekeeping tasks");
      })
      .finally(() => setLoading(false));
  }, []);

  const floors = [...new Set(tasks.map(t => t.floor))].sort();

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "PENDING").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    completed: tasks.filter(t => ["COMPLETED", "INSPECTED", "VERIFIED"].includes(t.status)).length,
    highPriority: tasks.filter(t => t.priority === "HIGH" && t.status === "PENDING").length,
  };

  const updateTask = (id: string, patch: Partial<HKTask>) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t));
    // Call correct API endpoint based on status transition
    if (patch.status === "IN_PROGRESS") {
      api.housekeeping.start(id).catch(() => {});
    } else if (patch.status === "COMPLETED") {
      api.housekeeping.complete(id, { notes: patch.notes }).catch(() => {});
    } else if (patch.status === "INSPECTED" || patch.status === "VERIFIED") {
      api.housekeeping.inspect(id, { passed: true }).catch(() => {});
    } else {
      api.housekeeping.update(id, patch).catch(() => {});
    }
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1500);
  };

  const filteredTasks = tasks.filter(t => filterStatus === "all" || t.status === filterStatus);
  const tasksByFloor = floors.reduce((acc, f) => {
    acc[f] = filteredTasks.filter(t => t.floor === f);
    return acc;
  }, {} as Record<number, HKTask[]>);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-400">Loading housekeeping tasks...</p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <AlertTriangle size={32} className="mx-auto text-amber-300 mb-2" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Tasks",   value: stats.total,       color: "#64748B" },
          { label: "Pending",       value: stats.pending,     color: "#F59E0B" },
          { label: "In Progress",   value: stats.inProgress,  color: "#3B82F6" },
          { label: "Completed",     value: stats.completed,   color: "#10B981" },
          { label: "Urgent",        value: stats.highPriority,color: "#EF4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="text-xs text-slate-400 mb-1">{label}</div>
            <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["board", "list", "maintenance"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "maintenance" ? "Maintenance" : t === "board" ? "By Floor" : "List"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-600">
            <option value="all">All Status</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating}
            className="btn-ghost text-xs flex items-center gap-1.5">
            <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
            {generating ? "Generating..." : "Auto-Schedule"}
          </button>
          <button className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={12} /> Add Task
          </button>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <CheckCircle size={32} className="mx-auto text-slate-300 mb-2" />
          <h3 className="font-bold text-slate-700 text-lg">No Housekeeping Tasks</h3>
          <p className="text-sm text-slate-400 mt-1">All rooms are clean or no tasks have been scheduled yet.</p>
        </div>
      )}

      {/* BOARD VIEW */}
      {activeTab === "board" && tasks.length > 0 && (
        <div className="space-y-3">
          {floors.map(floor => {
            const floorTasks = tasksByFloor[floor] ?? [];
            const isExpanded = expandedFloors[floor] !== false;
            const floorDone = floorTasks.filter(t => ["COMPLETED","INSPECTED","VERIFIED"].includes(t.status)).length;

            return (
              <div key={floor} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setExpandedFloors(e => ({ ...e, [floor]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 text-sm">Floor {floor}</span>
                    <div className="flex gap-1.5">
                      {Object.entries(STATUS_CFG).map(([status, cfg]) => {
                        const cnt = floorTasks.filter(t => t.status === status).length;
                        if (!cnt) return null;
                        return (
                          <span key={status} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cnt} {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all"
                          style={{ width: `${floorTasks.length ? (floorDone / floorTasks.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{floorDone}/{floorTasks.length}</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {floorTasks.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">No tasks for this floor</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {floorTasks.map(task => {
                          const tc = TYPE_CFG[task.type] ?? { label: task.type, emoji: "📋", color: "#64748B" };
                          const sc = STATUS_CFG[task.status] ?? STATUS_CFG.PENDING;
                          return (
                            <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                              {/* Priority indicator */}
                              <div className={`w-1 h-10 rounded-full shrink-0 ${task.priority === "HIGH" ? "bg-red-400" : task.priority === "NORMAL" ? "bg-blue-300" : "bg-slate-200"}`} />

                              {/* Room + type */}
                              <div className="w-14">
                                <div className="font-extrabold text-slate-900 text-sm">Rm {task.room}</div>
                                <div className="text-[10px] text-slate-400">{task.roomType}</div>
                              </div>

                              {/* Task type */}
                              <div className="flex items-center gap-1.5 w-32">
                                <span>{tc.emoji}</span>
                                <span className="text-xs font-semibold text-slate-700">{tc.label}</span>
                              </div>

                              {/* Assignee */}
                              <div className="flex-1">
                                {task.assignedTo ? (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                      {task.assignedTo.split(" ").map(n => n[0]).join("")}
                                    </div>
                                    {task.assignedTo}
                                  </div>
                                ) : (
                                  <button onClick={() => setAssignModal(task)}
                                    className="text-[11px] text-blue-500 hover:underline font-semibold">
                                    + Assign
                                  </button>
                                )}
                              </div>

                              {/* Time */}
                              {(task.startedAt || task.completedAt) && (
                                <div className="text-[10px] text-slate-400 w-16 text-right">
                                  {task.completedAt ? `Done ${task.completedAt}` : `Started ${task.startedAt}`}
                                </div>
                              )}

                              {/* Status */}
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full w-24 text-center"
                                style={{ background: sc.bg, color: sc.color }}>
                                {sc.label}
                              </span>

                              {/* Actions */}
                              <div className="flex gap-1">
                                {task.status === "PENDING" && (
                                  <button onClick={() => updateTask(task.id, { status: "IN_PROGRESS", startedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) })}
                                    className="text-[10px] px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition-colors">
                                    Start
                                  </button>
                                )}
                                {task.status === "IN_PROGRESS" && (
                                  <button onClick={() => updateTask(task.id, { status: "COMPLETED", completedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) })}
                                    className="text-[10px] px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-semibold transition-colors">
                                    Done
                                  </button>
                                )}
                                {task.status === "COMPLETED" && (
                                  <button onClick={() => updateTask(task.id, { status: "INSPECTED" })}
                                    className="text-[10px] px-2.5 py-1 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg font-semibold transition-colors">
                                    Inspect
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MAINTENANCE */}
      {activeTab === "maintenance" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Maintenance Tasks</h3>
            <button className="btn-primary text-xs flex items-center gap-1"><Plus size={12} /> Report Issue</button>
          </div>
          <div className="divide-y divide-slate-50">
            {tasks.filter(t => t.type === "MAINTENANCE").length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">No maintenance tasks found</div>
            ) : (
              tasks.filter(t => t.type === "MAINTENANCE").map(task => {
                const sc = STATUS_CFG[task.status] ?? STATUS_CFG.PENDING;
                return (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === "HIGH" ? "bg-red-400" : task.priority === "NORMAL" ? "bg-amber-400" : "bg-slate-300"}`} />
                    <div className="w-12 font-bold text-slate-900 text-sm">Rm {task.room}</div>
                    <div className="flex-1 text-sm text-slate-700">{task.notes || "Maintenance task"}</div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full`}
                      style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Assign Room {assignModal.room}</h3>
              <button onClick={() => setAssignModal(null)}><X size={14} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-2">
              {ATTENDANTS.map(a => (
                <button key={a.id} onClick={() => { updateTask(assignModal.id, { assignedTo: a.name }); setAssignModal(null); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-slate-100 transition-all text-left">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    {a.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{a.name}</div>
                    <div className="text-[10px] text-slate-400">{a.tasks} active tasks</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${a.tasks < 3 ? "bg-emerald-400" : a.tasks < 5 ? "bg-amber-400" : "bg-red-400"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
