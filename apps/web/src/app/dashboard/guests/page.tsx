"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Plus, Star, AlertTriangle, Users, TrendingUp, UserCheck, Calendar } from "lucide-react";
import api from "@/lib/api";

const FLAG: Record<string, string> = { US: "🇺🇸", ES: "🇪🇸", CN: "🇨🇳", DE: "🇩🇪", MX: "🇲🇽", GB: "🇬🇧", AE: "🇦🇪", JP: "🇯🇵", IT: "🇮🇹", KR: "🇰🇷" };
const initials = (f: string, l: string) => ((f?.[0] ?? "") + (l?.[0] ?? "")).toUpperCase();
const fmt = (n: number) => `$${n.toLocaleString()}`;

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  vip: boolean;
  blacklisted: boolean;
  totalStays: number;
  totalRevenue: number;
  tags: string[];
  createdAt: string;
}

function normalizeGuest(g: any): Guest {
  return {
    id: g.id,
    firstName: g.firstName ?? "",
    lastName: g.lastName ?? "",
    email: g.email ?? "",
    phone: g.phone ?? "",
    nationality: g.nationality ?? "",
    vip: g.vip ?? false,
    blacklisted: g.blacklisted ?? false,
    totalStays: g.totalStays ?? 0,
    totalRevenue: Number(g.totalRevenue ?? 0),
    tags: g.tags ?? [],
    createdAt: g.createdAt ?? new Date().toISOString(),
  };
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "vip" | "returning" | "blacklisted">("all");
  const [selected, setSelected] = useState<Guest | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await api.guests.list();
      const arr = Array.isArray(data) ? data : (data as any).guests ?? [];
      setGuests(arr.map(normalizeGuest));
    } catch (err) {
      console.error("Failed to fetch guests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuests(); }, []);

  const filtered = guests.filter(g => {
    const q = search.toLowerCase();
    const matchQ = !q || `${g.firstName} ${g.lastName} ${g.email} ${g.phone}`.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ? true :
      filter === "vip" ? g.vip :
      filter === "returning" ? g.totalStays > 1 :
      g.blacklisted;
    return matchQ && matchFilter;
  });

  const stats = {
    total: guests.length,
    vip: guests.filter(g => g.vip).length,
    returning: guests.filter(g => g.totalStays > 1).length,
    newMonth: guests.filter(g => new Date(g.createdAt) > new Date(Date.now() - 30 * 86400000)).length,
    totalRevenue: guests.reduce((a, g) => a + g.totalRevenue, 0),
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: <Users size={16} />, label: "Total Guests", value: stats.total, color: "#3B82F6" },
          { icon: <Star size={16} />, label: "VIP", value: stats.vip, color: "#F59E0B" },
          { icon: <UserCheck size={16} />, label: "Returning", value: stats.returning, color: "#10B981" },
          { icon: <Calendar size={16} />, label: "New (30d)", value: stats.newMonth, color: "#8B5CF6" },
          { icon: <TrendingUp size={16} />, label: "Total Revenue", value: fmt(stats.totalRevenue), color: "#10B981" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">{label}</span>
              <span className="p-1.5 rounded-lg" style={{ background: color + "15", color }}>{icon}</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {([
            { v: "all", l: `All (${guests.length})` },
            { v: "vip", l: `⭐ VIP (${stats.vip})` },
            { v: "returning", l: `↩ Returning (${stats.returning})` },
            { v: "blacklisted", l: `🚫 Blacklisted` },
          ] as const).map(({ v, l }) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5 text-xs">
          <Plus size={13} /> Add Guest
        </button>
      </div>

      {/* Guest table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Guest", "Contact", "Nationality", "Stays", "Revenue", "Tags", "Status", ""].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-400 py-12 text-sm">No guests found</td></tr>
            )}
            {filtered.map(g => (
              <tr key={g.id} onClick={() => setSelected(g)}
                className="border-t border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: g.vip ? "#FEF9C3" : "#EFF6FF", color: g.vip ? "#854D0E" : "#1D4ED8" }}>
                      {initials(g.firstName, g.lastName)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                        {g.firstName} {g.lastName}
                        {g.vip && <Star size={10} className="text-amber-400 fill-amber-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400">Since {new Date(g.createdAt).getFullYear()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-slate-600">{g.email}</div>
                  <div className="text-[10px] text-slate-400">{g.phone}</div>
                </td>
                <td className="px-4 py-3 text-sm">{FLAG[g.nationality] ?? "🌍"} {g.nationality}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{g.totalStays}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">{fmt(g.totalRevenue)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {g.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {g.blacklisted ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600"><AlertTriangle size={11} /> Blacklisted</span>
                  ) : g.vip ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600"><Star size={11} /> VIP</span>
                  ) : (
                    <span className="text-xs text-slate-400">Regular</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs">›</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Guest detail panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/10 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold"
                    style={{ background: selected.vip ? "#FEF9C3" : "#EFF6FF", color: selected.vip ? "#854D0E" : "#1D4ED8" }}>
                    {initials(selected.firstName, selected.lastName)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      {selected.firstName} {selected.lastName}
                      {selected.vip && <Star size={12} className="text-amber-400 fill-amber-400" />}
                    </div>
                    <div className="text-xs text-slate-400">{FLAG[selected.nationality]} {selected.nationality}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Total Stays", value: selected.totalStays },
                  { label: "Total Revenue", value: fmt(selected.totalRevenue) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400">{label}</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex gap-2"><span className="text-slate-400 w-16 shrink-0">Email</span><span className="font-medium truncate">{selected.email}</span></div>
                <div className="flex gap-2"><span className="text-slate-400 w-16 shrink-0">Phone</span><span className="font-medium">{selected.phone}</span></div>
              </div>
              <div className="space-y-2">
                <button className="w-full btn-primary text-xs py-2">+ New Reservation</button>
                <button className="w-full btn-ghost text-xs py-2">✉ Send Message</button>
                <button onClick={() => setGuests(gs => gs.map(g => g.id === selected.id ? { ...g, vip: !g.vip } : g))}
                  className="w-full btn-ghost text-xs py-2 text-amber-600 border-amber-200 hover:bg-amber-50">
                  {selected.vip ? "Remove VIP" : "⭐ Mark as VIP"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
