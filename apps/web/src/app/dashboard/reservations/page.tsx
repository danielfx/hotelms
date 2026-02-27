"use client";
import { Fragment, useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Plus, ChevronDown, ChevronUp, BedDouble,
  LogIn, LogOut, X, Clock, Users, DollarSign, Calendar
} from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type ResStatus = "CONFIRMED" | "PENDING" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";
type ResSource = "DIRECT" | "BOOKING_COM" | "EXPEDIA" | "AIRBNB" | "PHONE" | "WALK_IN";

interface Reservation {
  id: string;
  confirmationNo: string;
  guest: { firstName: string; lastName: string; email: string; phone: string; nationality: string };
  room: { number: string; roomType: { name: string; basePrice: number } };
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  status: ResStatus;
  source: ResSource;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes: string;
  eta?: string;
  checkedInAt?: string;
}

// Colors/styles only – labels resolved via translations inside the component
const STATUS_COLORS: Record<ResStatus, { bg: string; text: string; dot: string }> = {
  CONFIRMED:    { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
  PENDING:      { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  CHECKED_IN:   { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  CHECKED_OUT:  { bg: "#F8FAFC", text: "#64748B", dot: "#94A3B8" },
  CANCELLED:    { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  NO_SHOW:      { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
};

const STATUS_LABEL_KEYS: Record<ResStatus, string> = {
  CONFIRMED: "confirmed",
  PENDING: "pendingStatus",
  CHECKED_IN: "checkedIn",
  CHECKED_OUT: "checkedOut",
  CANCELLED: "cancelled",
  NO_SHOW: "noShow",
};

const SOURCE_ICONS: Record<ResSource, string> = {
  DIRECT: "🏨",
  BOOKING_COM: "🔵",
  EXPEDIA: "🟡",
  AIRBNB: "🔴",
  PHONE: "📞",
  WALK_IN: "🚶",
};

const SOURCE_LABEL_KEYS: Record<ResSource, string> = {
  DIRECT: "direct",
  BOOKING_COM: "bookingCom",
  EXPEDIA: "expedia",
  AIRBNB: "airbnb",
  PHONE: "phoneSource",
  WALK_IN: "walkIn",
};

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const initials = (f: string, l: string) => ((f?.[0] ?? "") + (l?.[0] ?? "")).toUpperCase();
const pad2 = (n: number) => String(n).padStart(2, "0");

function normalizeReservation(r: any): Reservation {
  const checkIn = (r.checkIn ?? "").split("T")[0];
  const checkOut = (r.checkOut ?? "").split("T")[0];
  return {
    id: r.id,
    confirmationNo: r.confirmationNo ?? "",
    guest: {
      firstName: r.guest?.firstName ?? "",
      lastName: r.guest?.lastName ?? "",
      email: r.guest?.email ?? "",
      phone: r.guest?.phone ?? "",
      nationality: r.guest?.nationality ?? "",
    },
    room: {
      number: r.room?.number ?? "",
      roomType: {
        name: r.room?.roomType?.name ?? "",
        basePrice: Number(r.room?.roomType?.basePrice ?? r.baseRate ?? 0),
      },
    },
    checkIn,
    checkOut,
    nights: r.nights ?? 1,
    adults: r.adults ?? 1,
    status: (r.status ?? "CONFIRMED") as ResStatus,
    source: (r.source ?? "DIRECT") as ResSource,
    totalAmount: Number(r.totalAmount ?? 0),
    paidAmount: Number(r.paidAmount ?? 0),
    balanceDue: Number(r.balanceDue ?? 0),
    notes: r.notes ?? r.specialRequests ?? "",
    eta: r.eta ?? undefined,
    checkedInAt: r.checkedInAt ?? undefined,
  };
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: ResStatus; label: string }) {
  const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.CONFIRMED;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {label}
    </span>
  );
}

function CheckInModal({ res, onConfirm, onClose }: { res: Reservation; onConfirm: (id: string, passportNo?: string, notes?: string) => void; onClose: () => void }) {
  const t = useTranslations("reservations");
  const tc = useTranslations("common");
  const [passportNo, setPassportNo] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900">{t("checkInGuest")}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{res.confirmationNo}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X size={14} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {initials(res.guest.firstName, res.guest.lastName)}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{res.guest.firstName} {res.guest.lastName}</div>
              <div className="text-xs text-slate-500">{tc("room")} {res.room.number} · {res.room.roomType.name} · {res.nights} {res.nights > 1 ? tc("nights") : tc("night")}</div>
            </div>
          </div>
          {res.notes && <div className="text-xs bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-amber-700">📝 {res.notes}</div>}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Passport / ID Number</label>
            <input value={passportNo} onChange={e => setPassportNo(e.target.value)} placeholder="Verify and enter ID number"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">{tc("notes")}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any notes for this check-in..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">{tc("cancel")}</button>
            <button onClick={() => { onConfirm(res.id, passportNo, notes); onClose(); }}
              className="flex-[2] py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
              <LogIn size={15} /> {tc("confirm")} {t("checkIn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckOutModal({ res, onConfirm, onClose }: { res: Reservation; onConfirm: (id: string, paymentMethod?: string, sendInvoiceEmail?: boolean) => void; onClose: () => void }) {
  const t = useTranslations("reservations");
  const tc = useTranslations("common");
  const [payMethod, setPayMethod] = useState("CREDIT_CARD");
  const [sendInvoice, setSendInvoice] = useState(true);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900">{t("checkOutGuest")}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{res.confirmationNo}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X size={14} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
              {initials(res.guest.firstName, res.guest.lastName)}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{res.guest.firstName} {res.guest.lastName}</div>
              <div className="text-xs text-slate-500">{tc("room")} {res.room.number} · {res.nights} {tc("nights")}</div>
            </div>
          </div>
          {/* Folio summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">{t("total")}</span><span className="font-semibold">{fmt(res.totalAmount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Paid</span><span className="font-semibold text-emerald-600">{fmt(res.paidAmount)}</span></div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
              <span>Balance due</span>
              <span className={res.balanceDue > 0 ? "text-red-600" : "text-emerald-600"}>{fmt(res.balanceDue)}</span>
            </div>
          </div>
          {res.balanceDue > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Payment Method</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CASH">Cash</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={sendInvoice} onChange={e => setSendInvoice(e.target.checked)} className="rounded" />
            Send invoice by email
          </label>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">{tc("cancel")}</button>
            <button onClick={() => { onConfirm(res.id, payMethod, sendInvoice); onClose(); }}
              className="flex-[2] py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
              <LogOut size={15} /> {tc("confirm")} {t("checkOut")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getToday() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function getTomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function NewReservationModal({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const t = useTranslations("reservations");
  const tc = useTranslations("common");
  const [form, setForm] = useState(() => ({
    firstName: "", lastName: "", email: "", phone: "",
    roomNumber: "101", roomType: "Standard", basePrice: 89,
    checkIn: getToday(), checkOut: getTomorrow(),
    adults: 1, source: "DIRECT" as ResSource, notes: "", eta: "",
  }));
  const [saving, setSaving] = useState(false);
  const nights = Math.max(1, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000));
  const total = form.basePrice * nights;

  const sourceLabel = (s: ResSource) => t(SOURCE_LABEL_KEYS[s] || s);

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) return;
    setSaving(true);
    try {
      await api.reservations.create({
        roomNumber: form.roomNumber,
        guestData: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: form.adults,
        source: form.source,
        notes: form.notes,
        eta: form.eta,
      });
      onSave();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to create reservation");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-900 text-lg">{t("title")}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X size={14} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Guest */}
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("guest")}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("name")} *</label>
              <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="John"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("name")} *</label>
              <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Smith"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("email")}</label>
              <input value={form.email} onChange={e => set("email", e.target.value)} type="email" placeholder="guest@email.com"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("phone")}</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 555 0100"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
          </div>

          {/* Stay */}
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">{tc("details")}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{t("checkIn")} *</label>
              <input value={form.checkIn} onChange={e => set("checkIn", e.target.value)} type="date"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{t("checkOut")} *</label>
              <input value={form.checkOut} onChange={e => set("checkOut", e.target.value)} type="date"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{t("room")}</label>
              <input value={form.roomNumber} onChange={e => set("roomNumber", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Adults</label>
              <input value={form.adults} onChange={e => set("adults", Number(e.target.value))} type="number" min={1} max={6}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{t("source")}</label>
              <select value={form.source} onChange={e => set("source", e.target.value as ResSource)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                {(Object.keys(SOURCE_ICONS) as ResSource[]).map(s => (
                  <option key={s} value={s}>{SOURCE_ICONS[s]} {sourceLabel(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">ETA</label>
              <input value={form.eta} onChange={e => set("eta", e.target.value)} placeholder="15:00"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("notes")}</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Anniversary, dietary restrictions, etc."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>

          {/* Summary */}
          {nights > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-700 mb-2">Booking Summary</div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{nights} {nights > 1 ? tc("nights") : tc("night")} × {fmt(form.basePrice)}</span>
                <span className="font-extrabold text-slate-900">{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">{tc("cancel")}</button>
          <button onClick={handleSave} disabled={saving} className="flex-[2] py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{saving ? tc("saving") : tc("create")}</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const t = useTranslations("reservations");
  const tc = useTranslations("common");
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResStatus | "all" | "arrivals" | "departures">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checkInModal, setCheckInModal] = useState<Reservation | null>(null);
  const [checkOutModal, setCheckOutModal] = useState<Reservation | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const statusLabel = (s: ResStatus) => t(STATUS_LABEL_KEYS[s] || s);
  const sourceLabel = (s: ResSource) => t(SOURCE_LABEL_KEYS[s] || s);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.reservations.list();
      const arr = Array.isArray(data) ? data : (data as any).reservations ?? [];
      setReservations(arr.map(normalizeReservation));
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const [todayStr, setTodayStr] = useState("");
  useEffect(() => { setTodayStr(getToday()); }, []);
  const { arrivalsToday, departuresToday, inHouse } = useMemo(() => ({
    arrivalsToday: reservations.filter(r => r.checkIn === todayStr && ["CONFIRMED", "PENDING"].includes(r.status)).length,
    departuresToday: reservations.filter(r => r.checkOut === todayStr && r.status === "CHECKED_IN").length,
    inHouse: reservations.filter(r => r.status === "CHECKED_IN").length,
  }), [reservations, todayStr]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reservations.filter(r => {
      const matchQ = !q || `${r.guest.firstName} ${r.guest.lastName} ${r.confirmationNo} ${r.room.number} ${r.guest.email}`.toLowerCase().includes(q);
      let matchS = true;
      if (statusFilter === "arrivals") {
        matchS = r.checkIn === todayStr && ["CONFIRMED", "PENDING"].includes(r.status);
      } else if (statusFilter === "departures") {
        matchS = r.checkOut === todayStr && r.status === "CHECKED_IN";
      } else if (statusFilter !== "all") {
        matchS = r.status === statusFilter;
      }
      return matchQ && matchS;
    });
  }, [reservations, search, statusFilter, todayStr]);

  const handleCheckIn = async (id: string, passportNo?: string, notes?: string) => {
    setReservations(rs => rs.map(r => r.id === id ? { ...r, status: "CHECKED_IN" as ResStatus, checkedInAt: new Date().toISOString() } : r));
    try {
      await api.reservations.checkIn(id, { passportNo, notes });
    } catch (err) {
      console.error("Check-in failed:", err);
      fetchReservations();
    }
  };
  const handleCheckOut = async (id: string, paymentMethod?: string, sendInvoiceEmail?: boolean) => {
    setReservations(rs => rs.map(r => r.id === id ? { ...r, status: "CHECKED_OUT" as ResStatus, balanceDue: 0 } : r));
    try {
      await api.reservations.checkOut(id, { paymentMethod, sendInvoiceEmail });
    } catch (err) {
      console.error("Check-out failed:", err);
      fetchReservations();
    }
  };
  const handleCancel = async (id: string) => {
    setReservations(rs => rs.map(r => r.id === id ? { ...r, status: "CANCELLED" as ResStatus } : r));
    try {
      await api.reservations.cancel(id);
    } catch (err) {
      console.error("Cancel failed:", err);
      fetchReservations();
    }
  };
  const handleAdd = () => {
    fetchReservations();
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <LogIn size={16} />, label: t("arrivalsToday"), value: arrivalsToday, color: "#3B82F6", filter: "arrivals" as const },
          { icon: <LogOut size={16} />, label: t("departuresToday"), value: departuresToday, color: "#10B981", filter: "departures" as const },
          { icon: <BedDouble size={16} />, label: t("inHouse"), value: inHouse, color: "#8B5CF6", filter: "CHECKED_IN" as const },
          { icon: <Clock size={16} />, label: t("pending"), value: reservations.filter(r => r.status === "PENDING").length, color: "#F59E0B", filter: "PENDING" as const },
        ].map(({ icon, label, value, color, filter }) => (
          <button key={label} onClick={() => setStatusFilter(f => f === filter ? "all" : filter)}
            className="bg-white rounded-2xl border border-slate-100 p-4 text-left hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-medium">{label}</span>
              <span className="p-1.5 rounded-xl" style={{ background: color + "15", color }}>{icon}</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{value}</div>
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
          {tc("all")} ({reservations.length})
        </button>
        {(Object.keys(STATUS_COLORS) as ResStatus[]).map(s => {
          const cnt = reservations.filter(r => r.status === s).length;
          const cfg = STATUS_COLORS[s];
          return (
            <button key={s} onClick={() => setStatusFilter(f => f === s ? "all" : s)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={{
                background: statusFilter === s ? cfg.bg : "#fff",
                color: statusFilter === s ? cfg.text : "#64748B",
                borderColor: statusFilter === s ? cfg.dot + "50" : "#E2E8F0",
              }}>
              {statusLabel(s)} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Search + New */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-1.5 text-xs shrink-0">
          <Plus size={13} /> {tc("new")} {t("title")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[t("guest"), t("confNo"), t("room"), t("checkIn"), t("checkOut"), t("total"), t("source"), t("status"), ""].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-slate-300 py-16 text-sm">{t("noReservations")}</td></tr>
              )}
              {filtered.map(r => {
                const isOpen = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr onClick={() => setExpanded(isOpen ? null : r.id)}
                      className="border-t border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-500 shrink-0">
                            {initials(r.guest.firstName, r.guest.lastName)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{r.guest.firstName} {r.guest.lastName}</div>
                            <div className="text-[10px] text-slate-400">{r.guest.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.confirmationNo}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-slate-900">{r.room.number}</div>
                        <div className="text-[10px] text-slate-400">{r.room.roomType.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {fmtDate(r.checkIn)}
                        {r.eta && <div className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock size={9} /> {r.eta}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{fmtDate(r.checkOut)} <span className="text-slate-400 text-[10px]">({r.nights}n)</span></td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-slate-900">{fmt(r.totalAmount)}</div>
                        {r.balanceDue > 0 ? (
                          <div className="text-[10px] text-red-500 font-semibold">Due: {fmt(r.balanceDue)}</div>
                        ) : (
                          <div className="text-[10px] text-emerald-500 font-semibold">✓ Settled</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{SOURCE_ICONS[r.source] ?? "🏨"}</span>
                        <span className="text-[10px] text-slate-400 ml-1">{sourceLabel(r.source)}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} label={statusLabel(r.status)} /></td>
                      <td className="px-4 py-3">
                        {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-300" />}
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isOpen && (
                      <tr className="bg-slate-50/40 border-t border-slate-100">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-3">
                            {r.notes && (
                              <div className="text-xs bg-amber-50 border border-amber-100 text-amber-700 rounded-lg px-3 py-1.5">📝 {r.notes}</div>
                            )}
                            {r.adults > 0 && <div className="text-xs text-slate-400 flex items-center gap-1"><Users size={11} /> {r.adults} adult{r.adults > 1 ? "s" : ""}</div>}
                            {r.checkedInAt && <div className="text-xs text-slate-400">{t("checkedIn")}: {fmtDate(r.checkedInAt.split("T")[0])}</div>}

                            <div className="ml-auto flex gap-2 flex-wrap">
                              {r.status === "CONFIRMED" || r.status === "PENDING" ? (
                                <button onClick={e => { e.stopPropagation(); setCheckInModal(r); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold">
                                  <LogIn size={12} /> {t("checkIn")}
                                </button>
                              ) : null}
                              {r.status === "CHECKED_IN" ? (
                                <button onClick={e => { e.stopPropagation(); setCheckOutModal(r); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold">
                                  <LogOut size={12} /> {t("checkOut")}
                                </button>
                              ) : null}
                              {["CONFIRMED", "PENDING"].includes(r.status) && (
                                <button onClick={e => { e.stopPropagation(); handleCancel(r.id); }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 bg-white">
                                  {tc("cancel")}
                                </button>
                              )}
                              <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/folio?reservationId=${r.id}`); }}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 bg-white">
                                {tc("view")} Folio
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {checkInModal && <CheckInModal res={checkInModal} onConfirm={handleCheckIn} onClose={() => setCheckInModal(null)} />}
      {checkOutModal && <CheckOutModal res={checkOutModal} onConfirm={handleCheckOut} onClose={() => setCheckOutModal(null)} />}
      {showNewModal && <NewReservationModal onSave={handleAdd} onClose={() => setShowNewModal(false)} />}
    </div>
  );
}
