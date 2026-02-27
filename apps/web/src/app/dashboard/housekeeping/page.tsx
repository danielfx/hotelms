"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { CheckCircle, Clock, AlertTriangle, Wrench, RefreshCw, Plus, ChevronDown, X, Check, User } from "lucide-react";
import { useTranslations } from "next-intl";
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

/* Colors only - labels are resolved inside components via useTranslations */
const TYPE_COLORS: Record<string, { emoji: string; color: string }> = {
  CHECKOUT_CLEANING: { emoji: "\ud83d\udeaa", color: "#EF4444" },
  STAYOVER:          { emoji: "\ud83d\udd04", color: "#3B82F6" },
  ARRIVAL_PREP:      { emoji: "\u2728",       color: "#10B981" },
  MAINTENANCE:       { emoji: "\ud83d\udd27", color: "#F59E0B" },
  DEEP_CLEAN:        { emoji: "\ud83e\uddf9", color: "#8B5CF6" },
  TURNDOWN:          { emoji: "\ud83c\udf19", color: "#6366F1" },
  INSPECTION:        { emoji: "\ud83d\udd0d", color: "#0EA5E9" },
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  PENDING:     { color: "#94A3B8", bg: "#F8FAFC" },
  IN_PROGRESS: { color: "#F59E0B", bg: "#FFFBEB" },
  COMPLETED:   { color: "#3B82F6", bg: "#EFF6FF" },
  INSPECTED:   { color: "#10B981", bg: "#ECFDF5" },
  VERIFIED:    { color: "#10B981", bg: "#ECFDF5" },
};

const TASK_TYPE_VALUES = [
  "CHECKOUT_CLEANING", "STAYOVER", "DEEP_CLEAN", "INSPECTION", "TURNDOWN",
] as const;

const PRIORITY_VALUES = ["LOW", "NORMAL", "HIGH"] as const;

const MAINTENANCE_TYPE_OPTIONS = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "OTHER", label: "Other" },
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
  const t = useTranslations("housekeeping");
  const tc = useTranslations("common");

  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"board" | "list" | "maintenance">("board");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});
  const [assignModal, setAssignModal] = useState<HKTask | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [attendants, setAttendants] = useState<{ id: string; name: string; tasks: number }[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  /* Translated lookup maps (inside component so hooks are valid) */
  const TYPE_LABELS: Record<string, string> = {
    CHECKOUT_CLEANING: t("cleaning"),
    STAYOVER:          t("cleaning"),
    ARRIVAL_PREP:      t("cleaning"),
    MAINTENANCE:       t("maintenance"),
    DEEP_CLEAN:        t("deepClean"),
    TURNDOWN:          t("turndown"),
    INSPECTION:        t("inspection"),
  };

  const STATUS_LABELS: Record<string, string> = {
    PENDING:     t("pending"),
    IN_PROGRESS: t("inProgress"),
    COMPLETED:   t("completed"),
    INSPECTED:   t("inspection"),
    VERIFIED:    t("inspection"),
  };

  const PRIORITY_LABELS: Record<string, string> = {
    HIGH:   t("high"),
    NORMAL: t("normal"),
    LOW:    t("low"),
  };

  const TASK_TYPE_LABELS: Record<string, string> = {
    CHECKOUT_CLEANING: t("cleaning"),
    STAYOVER:          t("cleaning"),
    DEEP_CLEAN:        t("deepClean"),
    INSPECTION:        t("inspection"),
    TURNDOWN:          t("turndown"),
  };

  const loadTasks = useCallback(async () => {
    try {
      const data = await api.housekeeping.list();
      const list = Array.isArray(data) ? data : ((data as any).tasks ?? (data as any).items ?? (data as any).data ?? []);
      const mapped = list.map(mapTask);
      setTasks(mapped);
      // Auto-expand all floors
      const floorMap: Record<number, boolean> = {};
      mapped.forEach((t: HKTask) => { floorMap[t.floor] = true; });
      setExpandedFloors(floorMap);
    } catch (err: any) {
      setError(err.message || "Failed to load housekeeping tasks");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadTasks(),
      api.housekeeping.attendants()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : (data.attendants ?? data.data ?? []);
          setAttendants(list.map((a: any) => ({
            id: a.id,
            name: a.name ?? `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() ?? "Unknown",
            tasks: a.activeTasks ?? a.tasks ?? a.taskCount ?? 0,
          })));
        })
        .catch(() => {}),
      api.rooms.list()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : (data.rooms ?? data.data ?? []);
          setRooms(list);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const floors = useMemo(() => [...new Set(tasks.map(t => t.floor))].sort(), [tasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === "PENDING").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    completed: tasks.filter(t => ["COMPLETED", "INSPECTED", "VERIFIED"].includes(t.status)).length,
    highPriority: tasks.filter(t => t.priority === "HIGH" && t.status === "PENDING").length,
  }), [tasks]);

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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.housekeeping.generate();
      await loadTasks();
    } catch (e: any) { alert(e.message || "Failed to generate schedule"); }
    setGenerating(false);
  };

  const filteredTasks = useMemo(() => tasks.filter(t => filterStatus === "all" || t.status === filterStatus), [tasks, filterStatus]);
  const tasksByFloor = useMemo(() => floors.reduce((acc, f) => {
    acc[f] = filteredTasks.filter(t => t.floor === f);
    return acc;
  }, {} as Record<number, HKTask[]>), [floors, filteredTasks]);

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
          <p className="text-sm text-slate-400">{tc("loading")}</p>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: tc("total"),      value: stats.total,       color: "#64748B" },
          { label: t("pending"),     value: stats.pending,     color: "#F59E0B" },
          { label: t("inProgress"),  value: stats.inProgress,  color: "#3B82F6" },
          { label: t("completed"),   value: stats.completed,   color: "#10B981" },
          { label: t("urgent"),      value: stats.highPriority,color: "#EF4444" },
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
          {(["board", "list", "maintenance"] as const).map(tabKey => (
            <button key={tabKey} onClick={() => setActiveTab(tabKey)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tabKey ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
              {tabKey === "maintenance" ? t("maintenance") : tabKey === "board" ? t("board") : t("list")}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-600">
            <option value="all">{tc("all")} {tc("status")}</option>
            {Object.keys(STATUS_COLORS).map(k => <option key={k} value={k}>{STATUS_LABELS[k] ?? k}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating}
            className="btn-ghost text-xs flex items-center gap-1.5">
            <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
            {generating ? tc("loading") : "Auto-Schedule"}
          </button>
          <button onClick={() => setShowAddTask(true)} className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={12} /> {t("addTask")}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <CheckCircle size={32} className="mx-auto text-slate-300 mb-2" />
          <h3 className="font-bold text-slate-700 text-lg">{t("noTasks")}</h3>
          <p className="text-sm text-slate-400 mt-1">{t("noTasks")}</p>
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
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-sm">{tc("floor")} {floor}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.entries(STATUS_COLORS).map(([status, cfg]) => {
                        const cnt = floorTasks.filter(t => t.status === status).length;
                        if (!cnt) return null;
                        return (
                          <span key={status} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cnt} {STATUS_LABELS[status] ?? status}
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
                      <div className="text-center py-6 text-slate-400 text-xs">{t("noTasks")}</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {floorTasks.map(task => {
                          const tcfg = TYPE_COLORS[task.type] ?? { emoji: "\ud83d\udccb", color: "#64748B" };
                          const scfg = STATUS_COLORS[task.status] ?? STATUS_COLORS.PENDING;
                          const typeLabel = TYPE_LABELS[task.type] ?? task.type;
                          const statusLabel = STATUS_LABELS[task.status] ?? task.status;
                          return (
                            <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors flex-wrap">
                              {/* Priority indicator */}
                              <div className={`w-1 h-10 rounded-full shrink-0 ${task.priority === "HIGH" ? "bg-red-400" : task.priority === "NORMAL" ? "bg-blue-300" : "bg-slate-200"}`} />

                              {/* Room + type */}
                              <div className="w-14">
                                <div className="font-extrabold text-slate-900 text-sm">Rm {task.room}</div>
                                <div className="text-[10px] text-slate-400">{task.roomType}</div>
                              </div>

                              {/* Task type */}
                              <div className="flex items-center gap-1.5 w-32">
                                <span>{tcfg.emoji}</span>
                                <span className="text-xs font-semibold text-slate-700">{typeLabel}</span>
                              </div>

                              {/* Assignee */}
                              <div className="flex-1 min-w-[100px]">
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
                                    + {t("assignTasks")}
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
                                style={{ background: scfg.bg, color: scfg.color }}>
                                {statusLabel}
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

      {/* LIST VIEW */}
      {activeTab === "list" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">{t("noTasks")}</div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">{tc("room")}</th>
                  <th className="px-5 py-3 font-medium">{tc("type")}</th>
                  <th className="px-5 py-3 font-medium">{tc("status")}</th>
                  <th className="px-5 py-3 font-medium">{t("assignee")}</th>
                  <th className="px-5 py-3 font-medium">{t("priority")}</th>
                  <th className="px-5 py-3 font-medium">{tc("notes")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const tcfg = TYPE_COLORS[task.type] ?? { emoji: "\ud83d\udccb", color: "#64748B" };
                  const scfg = STATUS_COLORS[task.status] ?? STATUS_COLORS.PENDING;
                  const typeLabel = TYPE_LABELS[task.type] ?? task.type;
                  const statusLabel = STATUS_LABELS[task.status] ?? task.status;
                  return (
                    <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 text-sm font-bold text-slate-900">Rm {task.room}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{tcfg.emoji}</span> {typeLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: scfg.bg, color: scfg.color }}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                              {task.assignedTo.split(" ").map(n => n[0]).join("")}
                            </div>
                            {task.assignedTo}
                          </div>
                        ) : (
                          <button onClick={() => setAssignModal(task)}
                            className="text-[11px] text-blue-500 hover:underline font-semibold">
                            + {t("assignTasks")}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold ${task.priority === "HIGH" ? "text-red-600" : task.priority === "NORMAL" ? "text-blue-600" : "text-slate-400"}`}>
                          {PRIORITY_LABELS[task.priority] ?? task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500 max-w-[200px] truncate">{task.notes || "\u2014"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MAINTENANCE */}
      {activeTab === "maintenance" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-bold text-slate-900">{t("maintenanceIssues")}</h3>
            <button onClick={() => setShowReportIssue(true)} className="btn-primary text-xs flex items-center gap-1"><Plus size={12} /> {t("reportIssue")}</button>
          </div>
          <div className="divide-y divide-slate-50">
            {tasks.filter(t => t.type === "MAINTENANCE").length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">{t("noIssues")}</div>
            ) : (
              tasks.filter(t => t.type === "MAINTENANCE").map(task => {
                const scfg = STATUS_COLORS[task.status] ?? STATUS_COLORS.PENDING;
                const statusLabel = STATUS_LABELS[task.status] ?? task.status;
                return (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors flex-wrap">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === "HIGH" ? "bg-red-400" : task.priority === "NORMAL" ? "bg-amber-400" : "bg-slate-300"}`} />
                    <div className="w-12 font-bold text-slate-900 text-sm">Rm {task.room}</div>
                    <div className="flex-1 text-sm text-slate-700">{task.notes || t("maintenance")}</div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full`}
                      style={{ background: scfg.bg, color: scfg.color }}>
                      {statusLabel}
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
              <h3 className="font-bold text-slate-900">{t("assignTasks")} {tc("room")} {assignModal.room}</h3>
              <button onClick={() => setAssignModal(null)}><X size={14} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-2">
              {attendants.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">{tc("noResults")}</div>
              ) : (
                attendants.map(a => (
                  <button key={a.id} onClick={() => {
                    api.housekeeping.assign(assignModal.id, a.id).catch(() => {});
                    updateTask(assignModal.id, { assignedTo: a.name });
                    setAssignModal(null);
                  }}
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          rooms={rooms}
          onClose={() => setShowAddTask(false)}
          onSuccess={async () => { setShowAddTask(false); await loadTasks(); }}
        />
      )}

      {/* Report Issue Modal */}
      {showReportIssue && (
        <ReportIssueModal
          rooms={rooms}
          onClose={() => setShowReportIssue(false)}
          onSuccess={async () => { setShowReportIssue(false); await loadTasks(); }}
        />
      )}
    </div>
  );
}

/* ---- Add Task Modal -------------------------------------------------------- */

function AddTaskModal({ rooms, onClose, onSuccess }: { rooms: any[]; onClose: () => void; onSuccess: () => void }) {
  const t = useTranslations("housekeeping");
  const tc = useTranslations("common");

  const TASK_TYPE_LABELS: Record<string, string> = {
    CHECKOUT_CLEANING: t("cleaning"),
    STAYOVER:          t("cleaning"),
    DEEP_CLEAN:        t("deepClean"),
    INSPECTION:        t("inspection"),
    TURNDOWN:          t("turndown"),
  };

  const PRIORITY_LABELS: Record<string, string> = {
    LOW:    t("low"),
    NORMAL: t("normal"),
    HIGH:   t("high"),
  };

  const [roomId, setRoomId] = useState("");
  const [type, setType] = useState("CHECKOUT_CLEANING");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) { alert("Please select a room"); return; }
    setSaving(true);
    try {
      await api.housekeeping.createTask({ roomId, type, priority, notes: notes || undefined });
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{t("addTask")}</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("room")}</label>
            <select value={roomId} onChange={e => setRoomId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
              <option value="">Select a room...</option>
              {rooms.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.number ?? r.roomNumber ?? r.name ?? r.id}{r.floor ? ` (${tc("floor")} ${r.floor})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("taskType")}</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
              {TASK_TYPE_VALUES.map(v => <option key={v} value={v}>{TASK_TYPE_LABELS[v] ?? v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("priority")}</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
              {PRIORITY_VALUES.map(v => <option key={v} value={v}>{PRIORITY_LABELS[v] ?? v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("notes")}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder={`${tc("notes")}...`}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">{tc("cancel")}</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50 text-sm px-5 py-2">
              {saving ? tc("saving") : tc("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- Report Issue Modal ---------------------------------------------------- */

function ReportIssueModal({ rooms, onClose, onSuccess }: { rooms: any[]; onClose: () => void; onSuccess: () => void }) {
  const t = useTranslations("housekeeping");
  const tc = useTranslations("common");

  const PRIORITY_LABELS: Record<string, string> = {
    LOW:    t("low"),
    NORMAL: t("normal"),
    HIGH:   t("high"),
  };

  const [roomId, setRoomId] = useState("");
  const [type, setType] = useState("PLUMBING");
  const [priority, setPriority] = useState("NORMAL");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) { alert("Please select a room"); return; }
    if (!description.trim()) { alert("Please enter a description"); return; }
    setSaving(true);
    try {
      await api.housekeeping.createMaintenance({ roomId, type, description, priority });
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to report issue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{t("reportIssue")}</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("room")}</label>
            <select value={roomId} onChange={e => setRoomId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
              <option value="">Select a room...</option>
              {rooms.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.number ?? r.roomNumber ?? r.name ?? r.id}{r.floor ? ` (${tc("floor")} ${r.floor})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("type")}</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
              {MAINTENANCE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("priority")}</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
              {PRIORITY_VALUES.map(v => <option key={v} value={v}>{PRIORITY_LABELS[v] ?? v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("description")}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={`${tc("description")}...`}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">{tc("cancel")}</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50 text-sm px-5 py-2">
              {saving ? tc("saving") : t("reportIssue")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
