"use client";
import { useState, useEffect } from "react";
import { BedDouble, Plus, LayoutGrid, List, RefreshCw } from "lucide-react";
import api from "@/lib/api";

// Status config
const STATUS = {
  AVAILABLE:    { label: "Available",    bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
  OCCUPIED:     { label: "Occupied",     bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  CLEANING:     { label: "Cleaning",     bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  MAINTENANCE:  { label: "Maintenance",  bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  RESERVED:     { label: "Reserved",     bg: "#F5F3FF", text: "#7C3AED", dot: "#8B5CF6" },
  OUT_OF_ORDER: { label: "Out of Order", bg: "#F8FAFC", text: "#94A3B8", dot: "#CBD5E1" },
  INSPECTING:   { label: "Inspecting",  bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<keyof typeof STATUS | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Room | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const TYPE_COLORS: Record<string, string> = {
    STD: "#3B82F6", DLX: "#8B5CF6", PRM: "#10B981", STE: "#F59E0B",
    STANDARD: "#3B82F6", DELUXE: "#8B5CF6", PREMIUM: "#10B981", SUITE: "#F59E0B",
  };

  const fetchRooms = async () => {
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
  };

  useEffect(() => { fetchRooms(); }, []);

  // Derive floors and room types from actual data
  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
  const roomTypes = ["all", ...new Set(rooms.map(r => r.roomType.code))];
  const typeNames: Record<string, string> = { all: "All Types" };
  rooms.forEach(r => { typeNames[r.roomType.code] = r.roomType.name; });

  const filtered = rooms.filter(r => {
    if (floorFilter !== "all" && r.floor !== floorFilter) return false;
    if (typeFilter !== "all" && r.roomType.code !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

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
          All ({rooms.length})
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
            {s.label} ({s.count})
          </button>
        ))}
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["all", ...floors] as (number | "all")[]).map(f => (
            <button key={f} onClick={() => setFloorFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${floorFilter === f ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {f === "all" ? "All Floors" : `Floor ${f}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {roomTypes.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {typeNames[t] ?? t}
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
            <Plus size={13} /> Add Room
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
              <span>Floor {floor}</span>
              <span className="text-slate-300">—</span>
              <span>{floorRooms.length} rooms</span>
              <span className="ml-1 text-emerald-500">{floorRooms.filter(r => r.status === "AVAILABLE").length} available</span>
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
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["#", "Room", "Type", "Floor", "Rate", "Status", "Tasks", ""].map(h => (
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
                              {cfg.label}
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
                  <div className="text-2xl font-extrabold text-slate-900">Room {selected.number}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: selected.roomType.color }}>{selected.roomType.name} · Floor {selected.floor}</div>
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs">✕</button>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: (STATUS[selected.status] ?? STATUS.AVAILABLE).text }}>
                <span className="w-2 h-2 rounded-full" style={{ background: (STATUS[selected.status] ?? STATUS.AVAILABLE).dot }} />
                {(STATUS[selected.status] ?? STATUS.AVAILABLE).label}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Quick info */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Rate", value: `$${selected.roomType.basePrice}/night` },
                  { label: "Floor", value: selected.floor },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 font-medium">{label}</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              {/* Change status */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Change Status</div>
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
                      {v.label}
                      {selected.status === k && <span className="ml-auto font-bold text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button className="w-full btn-primary text-xs py-2">+ New Reservation</button>
                <button className="w-full btn-ghost text-xs py-2">View History</button>
                <button className="w-full btn-ghost text-xs py-2 text-red-500 border-red-200 hover:bg-red-50">Mark Out of Order</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
