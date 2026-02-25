"use client";
import { useState, useEffect } from "react";
import { Users, Calendar, BedDouble, Plus, Building, DollarSign, Loader2 } from "lucide-react";
import api from "@/lib/api";

const statusColors: Record<string, string> = {
  DEFINITE: "bg-green-50 text-green-700",
  TENTATIVE: "bg-amber-50 text-amber-700",
  INQUIRY: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function GroupsPage() {
  const [tab, setTab] = useState<"groups" | "events">("groups");
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [eventSpaces, setEventSpaces] = useState<any[]>([]);

  useEffect(() => {
    Promise.allSettled([
      api.groups.list(),
      api.groups.listEventSpaces(),
    ]).then(([groupsRes, spacesRes]) => {
      if (groupsRes.status === "fulfilled") setGroups(Array.isArray(groupsRes.value) ? groupsRes.value : []);
      if (spacesRes.status === "fulfilled") setEventSpaces(Array.isArray(spacesRes.value) ? spacesRes.value : []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const mappedGroups = groups.map((g: any) => ({
    id: g.id,
    name: g.name || "Unnamed Group",
    status: (g.status || "INQUIRY").toUpperCase(),
    contactName: g.contactName || g.contact?.name || "—",
    companyName: g.companyName || g.company || null,
    checkIn: g.checkIn || g.checkInDate || g.startDate || "—",
    checkOut: g.checkOut || g.checkOutDate || g.endDate || "—",
    totalRooms: Number(g.totalRooms ?? g.roomsBlocked ?? 0),
    confirmedRooms: Number(g.confirmedRooms ?? g.roomsPickedUp ?? 0),
    baseRate: Number(g.baseRate ?? g.rate ?? 0),
    notes: g.notes || "",
  }));

  const mappedSpaces = eventSpaces.map((e: any) => ({
    id: e.id,
    name: e.name || "Unnamed Space",
    capacity: Number(e.capacity ?? 0),
    hourlyRate: Number(e.hourlyRate ?? e.rate ?? 0),
    bookingsThisMonth: Number(e.bookingsThisMonth ?? e.bookingCount ?? 0),
  }));

  const activeGroups = mappedGroups.filter(g => g.status !== "CANCELLED").length;
  const totalRoomsBlocked = mappedGroups.reduce((s, g) => s + g.totalRooms, 0);
  const totalEventsThisMonth = mappedSpaces.reduce((s, e) => s + e.bookingsThisMonth, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Groups & Events</h1>
          <p className="text-slate-500 text-sm mt-1">Manage group bookings and event spaces</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> {tab === "groups" ? "New Group" : "New Event Space"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Groups", value: activeGroups, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Total Rooms Blocked", value: totalRoomsBlocked, icon: BedDouble, color: "bg-purple-50 text-purple-600" },
          { label: "Event Spaces", value: mappedSpaces.length, icon: Building, color: "bg-green-50 text-green-600" },
          { label: "Events This Month", value: totalEventsThisMonth, icon: Calendar, color: "bg-amber-50 text-amber-600" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpi.color}`}><kpi.icon size={22} /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-sm text-slate-500">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["groups", "events"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "groups" ? "Group Bookings" : "Event Spaces"}
          </button>
        ))}
      </div>

      {tab === "groups" && (
        <div className="space-y-4">
          {mappedGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Group Bookings</h3>
              <p className="text-sm text-slate-500">Group bookings for conferences, weddings, and events will appear here.</p>
            </div>
          ) : mappedGroups.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{g.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[g.status] || "bg-slate-100 text-slate-600"}`}>{g.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{g.contactName}{g.companyName ? ` — ${g.companyName}` : ""}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">${g.baseRate}<span className="text-xs text-slate-500 font-normal">/night</span></div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  {g.checkIn} to {g.checkOut}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BedDouble size={14} className="text-slate-400" />
                  {g.confirmedRooms}/{g.totalRooms} rooms
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign size={14} className="text-slate-400" />
                  Est. ${(g.totalRooms * g.baseRate * 2).toLocaleString()}
                </div>
                {g.notes && (
                  <div className="text-sm text-slate-500 truncate">{g.notes}</div>
                )}
              </div>
              {g.status === "DEFINITE" && g.totalRooms > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Pickup: {Math.round((g.confirmedRooms / g.totalRooms) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(g.confirmedRooms / g.totalRooms) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "events" && (
        <div className="grid grid-cols-2 gap-4">
          {mappedSpaces.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Building size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Event Spaces</h3>
              <p className="text-sm text-slate-500">Add meeting rooms, ballrooms, and other event spaces to manage bookings.</p>
            </div>
          ) : mappedSpaces.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{e.name}</h3>
                <span className="text-sm text-slate-500">${e.hourlyRate}/hr</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Users size={14} /> Capacity: {e.capacity}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {e.bookingsThisMonth} bookings</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
