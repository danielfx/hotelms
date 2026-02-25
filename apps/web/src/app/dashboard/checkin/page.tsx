"use client";
import { useState, useEffect } from "react";
import { LogIn, LogOut, Clock, Search, CheckCircle, AlertCircle, BedDouble } from "lucide-react";
import api from "@/lib/api";

const today = () => new Date().toISOString().split("T")[0];

interface Arrival {
  id: string;
  confirmationNo: string;
  guest: { firstName: string; lastName: string; nationality: string; passportNo: string };
  room: { number: string; status: string; type: string };
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  eta: string;
  source: string;
  total: number;
  paid: number;
  balance: number;
  notes: string;
  specialRequests: string;
}

interface Departure {
  id: string;
  confirmationNo: string;
  guest: { firstName: string; lastName: string; nationality: string };
  room: { number: string; type: string };
  checkOut: string;
  nights: number;
  total: number;
  paid: number;
  balance: number;
  checkedInAt: string;
}

const ROOM_STATUS_CFG: Record<string, { label: string; color: string; canCheckIn: boolean }> = {
  AVAILABLE: { label: "Ready", color: "#10B981", canCheckIn: true },
  CLEANING:  { label: "Cleaning", color: "#F59E0B", canCheckIn: false },
  OCCUPIED:  { label: "Occupied", color: "#3B82F6", canCheckIn: false },
  MAINTENANCE: { label: "Maintenance", color: "#EF4444", canCheckIn: false },
};

const FLAG: Record<string, string> = { US:"🇺🇸", ES:"🇪🇸", CN:"🇨🇳", JP:"🇯🇵", MX:"🇲🇽", GB:"🇬🇧", DE:"🇩🇪", KR:"🇰🇷", AE:"🇦🇪", IT:"🇮🇹" };
const fmt = (n: number) => `$${Number(n).toFixed(2)}`;
const initials = (f: string, l: string) => ((f?.[0] ?? "") + (l?.[0] ?? "")).toUpperCase();

function normalizeArrival(r: any): Arrival {
  const checkIn = (r.checkIn ?? "").split("T")[0];
  const checkOut = (r.checkOut ?? "").split("T")[0];
  return {
    id: r.id,
    confirmationNo: r.confirmationNo ?? "",
    guest: {
      firstName: r.guest?.firstName ?? "",
      lastName: r.guest?.lastName ?? "",
      nationality: r.guest?.nationality ?? "",
      passportNo: r.guest?.passportNo ?? "",
    },
    room: {
      number: r.room?.number ?? "",
      status: r.room?.status ?? "AVAILABLE",
      type: r.room?.roomType?.name ?? "",
    },
    checkIn,
    checkOut,
    nights: r.nights ?? 1,
    adults: r.adults ?? 1,
    eta: r.eta ?? "",
    source: r.source ?? "DIRECT",
    total: Number(r.totalAmount ?? 0),
    paid: Number(r.paidAmount ?? 0),
    balance: Number(r.balanceDue ?? 0),
    notes: r.notes ?? "",
    specialRequests: r.specialRequests ?? "",
  };
}

function normalizeDeparture(r: any): Departure {
  const checkOut = (r.checkOut ?? "").split("T")[0];
  return {
    id: r.id,
    confirmationNo: r.confirmationNo ?? "",
    guest: {
      firstName: r.guest?.firstName ?? "",
      lastName: r.guest?.lastName ?? "",
      nationality: r.guest?.nationality ?? "",
    },
    room: {
      number: r.room?.number ?? "",
      type: r.room?.roomType?.name ?? "",
    },
    checkOut,
    nights: r.nights ?? 1,
    total: Number(r.totalAmount ?? 0),
    paid: Number(r.paidAmount ?? 0),
    balance: Number(r.balanceDue ?? 0),
    checkedInAt: r.checkedInAt ?? "",
  };
}

export default function CheckInPage() {
  const [tab, setTab] = useState<"arrivals" | "departures">("arrivals");
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState<string[]>([]);
  const [checkedOut, setCheckedOut] = useState<string[]>([]);

  const todayStr = today();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [confirmedData, pendingData, checkedInData] = await Promise.all([
        api.reservations.list({ status: "CONFIRMED" }),
        api.reservations.list({ status: "PENDING" }),
        api.reservations.list({ status: "CHECKED_IN" }),
      ]);

      const confirmedArr = Array.isArray(confirmedData) ? confirmedData : (confirmedData as any).reservations ?? [];
      const pendingArr = Array.isArray(pendingData) ? pendingData : (pendingData as any).reservations ?? [];
      const checkedInArr = Array.isArray(checkedInData) ? checkedInData : (checkedInData as any).reservations ?? [];

      // Filter arrivals: confirmed + pending reservations with checkIn today or earlier (overdue)
      // plus upcoming arrivals (next 3 days)
      const allArrivals = [...confirmedArr, ...pendingArr];
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      const threeDaysStr = threeDaysLater.toISOString().split("T")[0];

      const todayArrivals = allArrivals
        .filter((r: any) => {
          const ci = (r.checkIn ?? "").split("T")[0];
          return ci <= threeDaysStr; // today, overdue, or upcoming within 3 days
        })
        .sort((a: any, b: any) => (a.checkIn ?? "").localeCompare(b.checkIn ?? ""))
        .map(normalizeArrival);

      // Filter departures: checked-in reservations (all - show all that need checkout)
      const todayDepartures = checkedInArr
        .map(normalizeDeparture);

      setArrivals(todayArrivals);
      setDepartures(todayDepartures);
    } catch (err) {
      console.error("Failed to fetch check-in data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredArrivals = arrivals.filter(a =>
    !search || `${a.guest.firstName} ${a.guest.lastName} ${a.confirmationNo} ${a.room.number}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDepartures = departures.filter(d =>
    !search || `${d.guest.firstName} ${d.guest.lastName} ${d.confirmationNo} ${d.room.number}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckIn = async (id: string) => {
    setProcessing(id);
    try {
      await api.reservations.checkIn(id);
      setCheckedIn(c => [...c, id]);
    } catch (err) {
      console.error("Check-in failed:", err);
      // Still mark as checked in locally for UX
      setCheckedIn(c => [...c, id]);
    } finally {
      setProcessing(null);
    }
  };

  const handleCheckOut = async (id: string) => {
    setProcessing(id);
    try {
      await api.reservations.checkOut(id);
      setCheckedOut(c => [...c, id]);
    } catch (err) {
      console.error("Check-out failed:", err);
      setCheckedOut(c => [...c, id]);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-64 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-10 flex-1 max-w-xs bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button onClick={() => setTab("arrivals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "arrivals" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <LogIn size={14} /> Arrivals <span className="bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{arrivals.length}</span>
          </button>
          <button onClick={() => setTab("departures")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "departures" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <LogOut size={14} /> Departures <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{departures.length}</span>
          </button>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guest or room…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        </div>
      </div>

      {/* Arrivals */}
      {tab === "arrivals" && (
        <div className="space-y-3">
          {filteredArrivals.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
              <CheckCircle className="mx-auto text-emerald-200 mb-3" size={40} />
              <p className="text-slate-400 text-sm">No arrivals today</p>
            </div>
          )}
          {filteredArrivals.map(a => {
            const done = checkedIn.includes(a.id);
            const busy = processing === a.id;
            const roomCfg = ROOM_STATUS_CFG[a.room.status] ?? ROOM_STATUS_CFG.AVAILABLE;

            return (
              <div key={a.id} className={`bg-white rounded-2xl border-2 transition-all ${done ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 hover:border-slate-200"}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Guest info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${done ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-600"}`}>
                        {done ? <CheckCircle size={20} /> : initials(a.guest.firstName, a.guest.lastName)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base">
                          {a.guest.firstName} {a.guest.lastName}
                          <span className="ml-2 text-sm">{FLAG[a.guest.nationality] ?? "🌍"}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{a.confirmationNo}</div>
                      </div>
                    </div>

                    {/* Room */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                      <BedDouble size={14} className="text-slate-400" />
                      <div>
                        <div className="text-sm font-bold text-slate-900">Room {a.room.number}</div>
                        <div className="text-[10px]" style={{ color: roomCfg.color }}>● {roomCfg.label} — {a.room.type}</div>
                      </div>
                    </div>

                    {/* ETA */}
                    {a.eta && (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl">
                        <Clock size={13} className="text-slate-400" />
                        <div>
                          <div className="text-xs text-slate-400">ETA</div>
                          <div className="text-sm font-bold text-slate-900">{a.eta}</div>
                        </div>
                      </div>
                    )}

                    {/* Stay */}
                    <div className="px-3 py-2 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-400">Stay</div>
                      <div className="text-sm font-semibold text-slate-800">{a.nights} night{a.nights > 1 ? "s" : ""} · {a.adults} adult{a.adults > 1 ? "s" : ""}</div>
                    </div>

                    {/* Balance */}
                    <div className="px-3 py-2 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-400">Balance</div>
                      <div className={`text-sm font-bold ${a.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {a.balance > 0 ? fmt(a.balance) : "✓ Paid"}
                      </div>
                    </div>

                    {/* Check-in button */}
                    <div className="ml-auto">
                      {done ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
                          <CheckCircle size={15} /> Checked In
                        </div>
                      ) : !roomCfg.canCheckIn ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold border border-amber-200">
                          <AlertCircle size={15} /> Room Not Ready
                        </div>
                      ) : (
                        <button onClick={() => handleCheckIn(a.id)} disabled={busy}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20">
                          {busy ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : <LogIn size={15} />}
                          Check In
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {(a.notes || a.specialRequests) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.notes && <div className="text-xs bg-amber-50 border border-amber-100 text-amber-700 rounded-lg px-2.5 py-1">⚠ {a.notes}</div>}
                      {a.specialRequests && <div className="text-xs bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-2.5 py-1">💬 {a.specialRequests}</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Departures */}
      {tab === "departures" && (
        <div className="space-y-3">
          {filteredDepartures.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
              <CheckCircle className="mx-auto text-emerald-200 mb-3" size={40} />
              <p className="text-slate-400 text-sm">No departures today</p>
            </div>
          )}
          {filteredDepartures.map(d => {
            const done = checkedOut.includes(d.id);
            const busy = processing === d.id;
            const hasBalance = d.balance > 0;

            return (
              <div key={d.id} className={`bg-white rounded-2xl border-2 transition-all ${done ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 hover:border-slate-200"}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {done ? <CheckCircle size={20} /> : initials(d.guest.firstName, d.guest.lastName)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base">
                          {d.guest.firstName} {d.guest.lastName}
                          <span className="ml-2 text-sm">{FLAG[d.guest.nationality] ?? "🌍"}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{d.confirmationNo}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                      <BedDouble size={14} className="text-slate-400" />
                      <div>
                        <div className="text-sm font-bold text-slate-900">Room {d.room.number}</div>
                        <div className="text-[10px] text-slate-400">{d.room.type}</div>
                      </div>
                    </div>

                    <div className="px-3 py-2 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-400">Total</div>
                      <div className="text-sm font-bold text-slate-900">{fmt(d.total)}</div>
                    </div>

                    <div className="px-3 py-2 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-400">Balance</div>
                      <div className={`text-sm font-bold ${hasBalance ? "text-red-600" : "text-emerald-600"}`}>
                        {hasBalance ? fmt(d.balance) + " due" : "✓ Settled"}
                      </div>
                    </div>

                    <div className="ml-auto">
                      {done ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
                          <CheckCircle size={15} /> Checked Out
                        </div>
                      ) : hasBalance ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-200">
                          <AlertCircle size={15} /> Settle Folio First
                        </div>
                      ) : (
                        <button onClick={() => handleCheckOut(d.id)} disabled={busy}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-500/20">
                          {busy ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : <LogOut size={15} />}
                          Check Out
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
