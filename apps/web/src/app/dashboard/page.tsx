"use client";
import { useEffect } from "react";
import { useHotelStore } from "@/store/hotel.store";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { fmt, fmtDate, today, initials } from "@/lib/utils";
import { RES_STATUS_CONFIG, ROOM_TYPES } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DashboardPage() {
  const { rooms, reservations, loaded, fetchData } = useHotelStore();

  useEffect(() => {
    if (!loaded) fetchData();
  }, [loaded, fetchData]);
  const todayStr = today();

  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const available = rooms.filter((r) => r.status === "available").length;
  const cleaning = rooms.filter((r) => r.status === "cleaning").length;
  const occupancyPct = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;
  const arrivalsToday = reservations.filter((r) => r.checkIn === todayStr).length;
  const departuresToday = reservations.filter((r) => r.checkOut === todayStr).length;
  const activeRes = reservations.filter(r => r.status !== "cancelled");
  const totalRevenue = activeRes.reduce((a, r) => a + r.total, 0);
  const avgRate = activeRes.length > 0 ? Math.round(totalRevenue / activeRes.length) : 0;

  // Occupancy by type
  const byType = ROOM_TYPES.map((t) => {
    const typeRooms = rooms.filter((r) => r.typeId === t.id);
    const occ = typeRooms.filter((r) => r.status === "occupied").length;
    return { name: t.name, pct: typeRooms.length > 0 ? Math.round((occ / typeRooms.length) * 100) : 0, color: t.color };
  });

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {greeting} 👋
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏨" label="Occupancy" value={`${occupancyPct}%`} sub={`${occupied} of ${rooms.length} rooms`} accent="#3B82F6" />
        <StatCard icon="✅" label="Available" value={available} sub="rooms ready" accent="#10B981" />
        <StatCard icon="🔑" label="Arrivals" value={arrivalsToday} sub="today" accent="#8B5CF6" />
        <StatCard icon="🧳" label="Departures" value={departuresToday} sub="today" accent="#F59E0B" />
        <StatCard icon="💰" label="Total Revenue" value={fmt(totalRevenue)} sub="all bookings" accent="#10B981" />
        <StatCard icon="📊" label="Avg Daily Rate" value={fmt(avgRate)} sub="per room" accent="#3B82F6" />
        <StatCard icon="🧹" label="Cleaning" value={cleaning} sub="rooms in progress" accent="#F59E0B" />
        <StatCard icon="📋" label="Reservations" value={reservations.length} sub="total" accent="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy by type chart */}
        <div className="card p-5 col-span-1">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Occupancy by Room Type</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byType} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, "Occupancy"]}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
              />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                {byType.map((t) => <Cell key={t.name} fill={t.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent reservations */}
        <div className="card col-span-2">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-700">Recent Reservations</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {reservations.slice(0, 7).map((r) => {
              const cfg = RES_STATUS_CONFIG[r.status];
              return (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0">
                    {initials(r.guestName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{r.guestName}</div>
                    <div className="text-xs text-slate-400">Room {r.roomNumber} · {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">{fmt(r.total)}</div>
                    <Badge label={cfg.label} bg={cfg.bg} text={cfg.text} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
