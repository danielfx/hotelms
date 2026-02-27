"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BedDouble, Plus, LayoutGrid, List, RefreshCw } from "lucide-react";
import api from "@/lib/api";

// Status config
const STATUS = {
  AVAILABLE:    { key: "statusAvailable",    bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
  OCCUPIED:     { key: "statusOccupied",     bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  CLEANING:     { key: "statusCleaning",     bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  MAINTENANCE:  { key: "statusMaintenance",  bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  RESERVED:     { key: "statusReserved",     bg: "#F5F3FF", text: "#7C3AED", dot: "#8B5CF6" },
  OUT_OF_ORDER: { key: "statusOutOfOrder",   bg: "#F8FAFC", text: "#94A3B8", dot: "#CBD5E1" },
  INSPECTING:   { key: "statusInspecting",   bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
} as const;

interface Room {
  id: string;
  number: string;
  floor: number;
  status: keyof typeof STATUS;
  roomType: { name: string; code: string; basePrice: number; color: string; capacity?: number; bedType?: string };
  hkTasks: any[];
  reservations: any[];
}

const TYPE_COLORS: Record<string, string> = {
  STD: "#3B82F6", DLX: "#8B5CF6", PRM: "#10B981", STE: "#F59E0B",
  STANDARD: "#3B82F6", DELUXE: "#8B5CF6", PREMIUM: "#10B981", SUITE: "#F59E0B",
};

export default function RoomsPage() {
  const router = useRouter();
  const t = useTranslations("rooms");
  const tc = useTranslations("common");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<keyof typeof STATUS | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Room | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.rooms.list();
      const arr = Array.isArray(data) ? data : (data as any).rooms ?? [];
      const normalized: Room[] = arr.map((r: any) => {
        const code = r.roomType?.code ?? "STD";
        return {
          id: r.id,
          number: r.number ?? "",
          floor: r.floor ?? 1,
          status: (r.status ?? "AVAILABLE") as keyof typeof STATUS,
          roomType: {
            name: r.roomType?.name ?? "Standard",
            code,
            basePrice: Number(r.roomType?.basePrice ?? 0),
            color: TYPE_COLORS[code] ?? "#3B82F6",
            capacity: r.roomType?.capacity ?? 2,
            bedType: r.roomType?.bedType ?? "",
          },
          hkTasks: r.hkTasks ?? [],
          reservations: r.reservations ?? [],
        };
      });
      setRooms(normalized);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // Derive floors and room types from actual data
  const floors = useMemo(() => [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b), [rooms]);
  const roomTypes = useMemo(() => ["all", ...new Set(rooms.map(r => r.roomType.code))], [rooms]);
  const typeNames = useMemo(() => {
    const names: Record<string, string> = { all: "All Types" };
    rooms.forEach(r => { names[r.roomType.code] = r.roomType.name; });
    return names;
  }, [rooms]);

  const filtered = useMemo(() => rooms.filter(r => {
    if (floorFilter !== "all" && r.floor !== floorFilter) return false;
    if (typeFilter !== "all" && r.roomType.code !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  }), [rooms, floorFilter, typeFilter, statusFilter]);

  const stats = Object.entries(STATUS).map(([k, v]) => ({
    key: k as keyof typeof STATUS,
    count: rooms.filter(r => r.status === k).length,
    ...v,
  }));

  const handleStatusChange = async (id: string, newStatus: keyof typeof STATUS) => {
    try {
      await api.rooms.updateStatus(id, newStatus);
      setRooms(rs => rs.map(r => r.id === id ? { ...r, status: newStatus } : r));
      setSelected(r => r && r.id === id ? { ...r, status: newStatus } : r);
    } catch (err) {
      console.error("Failed to update room status:", err);
      // Fallback: update locally anyway
      setRooms(rs => rs.map(r => r.id === id ? { ...r, status: newStatus } : r));
      setSelected(r => r && r.id === id ? { ...r, status: newStatus } : r);
    }
  };

  // Helper to get translated status label
  const statusLabel = (statusKey: keyof typeof STATUS) => {
    const cfg = STATUS[statusKey] ?? STATUS.AVAILABLE;
    return t(cfg.key as any);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
          {tc("all")} ({rooms.length})
        </button>
        {stats.map(s => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={{
              background: statusFilter === s.key ? s.bg : "#fff",
              color: statusFilter === s.key ? s.text : "#64748B",
              borderColor: statusFilter === s.key ? s.dot + "60" : "#E2E8F0",
            }}>
            <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
            {t(s.key as any)} ({s.count})
          </button>
        ))}
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["all", ...floors] as (number | "all")[]).map(f => (
            <button key={f} onClick={() => setFloorFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${floorFilter === f ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {f === "all" ? t("allFloors") : `${tc("floor")} ${f}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {roomTypes.map(tp => (
            <button key={tp} onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === tp ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {typeNames[tp] ?? tp}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => fetchRooms()} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
            <RefreshCw size={14} className="text-slate-400" />
          </button>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button onClick={() => setView("grid")} className={`p-1.5 rounded-lg ${view === "grid" ? "bg-white shadow-sm" : ""}`}><LayoutGrid size={14} className={view === "grid" ? "text-slate-700" : "text-slate-400"} /></button>
            <button onClick={() => setView("list")} className={`p-1.5 rounded-lg ${view === "list" ? "bg-white shadow-sm" : ""}`}><List size={14} className={view === "list" ? "text-slate-700" : "text-slate-400"} /></button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> {t("addRoom")}
          </button>
        </div>
      </div>

      {/* Rooms by floor */}
      {floors.filter(f => floorFilter === "all" || f === floorFilter).map(floor => {
        const floorRooms = filtered.filter(r => r.floor === floor);
        if (!floorRooms.length) return null;
        return (
          <div key={floor}>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>{tc("floor")} {floor}</span>
              <span className="text-slate-300">—</span>
              <span>{floorRooms.length} {tc("rooms")}</span>
              <span className="ml-1 text-emerald-500">{floorRooms.filter(r => r.status === "AVAILABLE").length} {t("statusAvailable").toLowerCase()}</span>
            </div>
            {view === "grid" ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {floorRooms.map(room => {
                  const cfg = STATUS[room.status] ?? STATUS.AVAILABLE;
                  const isSelected = selected?.id === room.id;
                  return (
                    <button key={room.id} onClick={() => setSelected(room === selected ? null : room)}
                      className="bg-white rounded-xl p-2.5 text-left transition-all hover:shadow-md border-2"
                      style={{ borderColor: isSelected ? room.roomType.color : "#F1F5F9" }}>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-sm font-extrabold text-slate-900">{room.number}</span>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                      </div>
                      <div className="text-[9px] font-bold truncate" style={{ color: room.roomType.color }}>{room.roomType.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">${room.roomType.basePrice}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["#", tc("room"), tc("type"), tc("floor"), "Rate", tc("status"), "Tasks", ""].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {floorRooms.map((room, i) => {
                      const cfg = STATUS[room.status] ?? STATUS.AVAILABLE;
                      return (
                        <tr key={room.id} onClick={() => setSelected(room)}
                          className="border-t border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-300 font-mono">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-900">{room.number}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: room.roomType.color + "15", color: room.roomType.color }}>{room.roomType.name}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{room.floor}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-800">${room.roomType.basePrice}/night</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: cfg.text }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                              {statusLabel(room.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{room.hkTasks.length > 0 ? `${room.hkTasks.length} pending` : "—"}</td>
                          <td className="px-4 py-3 text-slate-300">›</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <BedDouble className="mx-auto text-slate-200 mb-3" size={40} />
          <p className="text-slate-400 text-sm">No rooms match your filters</p>
        </div>
      )}

      {/* Detail sidebar */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/10 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100" style={{ background: `linear-gradient(135deg, ${selected.roomType.color}12, transparent)` }}>
              <div className="flex justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{tc("room")} {selected.number}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: selected.roomType.color }}>{selected.roomType.name} · {tc("floor")} {selected.floor}</div>
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs">✕</button>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: (STATUS[selected.status] ?? STATUS.AVAILABLE).text }}>
                <span className="w-2 h-2 rounded-full" style={{ background: (STATUS[selected.status] ?? STATUS.AVAILABLE).dot }} />
                {statusLabel(selected.status)}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Quick info */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Rate", value: `$${selected.roomType.basePrice}/night` },
                  { label: tc("floor"), value: selected.floor },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 font-medium">{label}</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              {/* Change status */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t("changeStatus")}</div>
                <div className="space-y-1">
                  {(Object.entries(STATUS) as [keyof typeof STATUS, typeof STATUS[keyof typeof STATUS]][]).map(([k, v]) => (
                    <button key={k} onClick={() => handleStatusChange(selected.id, k)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
                      style={{
                        background: selected.status === k ? v.bg : "#fff",
                        color: selected.status === k ? v.text : "#475569",
                        borderColor: selected.status === k ? v.dot + "50" : "#F1F5F9",
                      }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: v.dot }} />
                      {t(v.key as any)}
                      {selected.status === k && <span className="ml-auto font-bold text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button onClick={() => router.push('/dashboard/reservations')} className="w-full btn-primary text-xs py-2">+ {t("newReservation")}</button>
                <button onClick={() => router.push('/dashboard/folio')} className="w-full btn-ghost text-xs py-2">{t("viewHistory")}</button>
                <button onClick={async () => {
                  try {
                    await api.rooms.updateStatus(selected.id, 'OUT_OF_ORDER');
                    fetchRooms();
                  } catch (e: any) {
                    alert(e.message);
                  }
                }} className="w-full btn-ghost text-xs py-2 text-red-500 border-red-200 hover:bg-red-50">{t("markOutOfOrder")}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <AddRoomModal
          roomTypes={rooms.map(r => ({ code: r.roomType.code, name: r.roomType.name }))}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchRooms(); }}
        />
      )}
    </div>
  );
}

function AddRoomModal({ roomTypes, onClose, onSaved }: {
  roomTypes: { code: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("rooms");
  const tc = useTranslations("common");
  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [saving, setSaving] = useState(false);

  // Deduplicate room types
  const uniqueTypes = roomTypes.filter((tp, i, arr) => arr.findIndex(x => x.code === tp.code) === i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.rooms.create({ number, floor, roomTypeId });
      onSaved();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{t("addRoom")}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t("roomNumber")}</label>
            <input
              type="text"
              value={number}
              onChange={e => setNumber(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="e.g. 101"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{tc("floor")}</label>
            <input
              type="number"
              value={floor}
              onChange={e => setFloor(Number(e.target.value))}
              required
              min={1}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t("roomType")}</label>
            <select
              value={roomTypeId}
              onChange={e => setRoomTypeId(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              <option value="">Select a room type</option>
              {uniqueTypes.map(tp => (
                <option key={tp.code} value={tp.code}>{tp.name} ({tp.code})</option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-xs px-4 py-2">{tc("cancel")}</button>
            <button type="submit" disabled={saving} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">
              {saving ? tc("saving") : tc("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
