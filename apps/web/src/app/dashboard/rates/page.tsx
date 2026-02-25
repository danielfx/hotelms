"use client";
import { useState, useMemo, useEffect } from "react";
import { Plus, Copy, ChevronLeft, ChevronRight, X, Check, AlertCircle, TrendingUp } from "lucide-react";
import api from "@/lib/api";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type PlanType = "PUBLIC" | "MEMBER" | "CORPORATE" | "OTA" | "PACKAGE" | "PROMO";
type MealPlan = "ROOM_ONLY" | "BED_BREAKFAST" | "HALF_BOARD" | "FULL_BOARD" | "ALL_INCLUSIVE";
type CancelPolicy = "FREE" | "MODERATE" | "STRICT" | "NON_REFUNDABLE";

interface RatePlan {
  id: string; name: string; code: string; type: PlanType;
  mealPlan: MealPlan; cancellationPolicy: CancelPolicy;
  cancellationHours: number; isRefundable: boolean;
  markup: number; discount: number; minLOS: number;
  availableOnline: boolean; isActive: boolean;
  basePrice: number;
}

interface DailyRate {
  price: number; available: number; closed: boolean;
  closedToArrival: boolean; closedToDeparture: boolean;
  minLOS?: number;
}

// Grid: planId -> roomTypeCode -> dateStr -> DailyRate
type RateGrid = Record<string, Record<string, Record<string, DailyRate>>>;

const ROOM_TYPES = [
  { code: "STD", name: "Standard",  basePrice: 89 },
  { code: "DLX", name: "Deluxe",    basePrice: 139 },
  { code: "PRM", name: "Premium",   basePrice: 189 },
  { code: "STE", name: "Suite",     basePrice: 289 },
];

const TYPE_CFG: Record<PlanType, { label: string; color: string }> = {
  PUBLIC:    { label: "Public",    color: "#3B82F6" },
  MEMBER:    { label: "Member",    color: "#8B5CF6" },
  CORPORATE: { label: "Corporate", color: "#0F766E" },
  OTA:       { label: "OTA",       color: "#D97706" },
  PACKAGE:   { label: "Package",   color: "#059669" },
  PROMO:     { label: "Promo",     color: "#E11D48" },
};

const CANCEL_CFG: Record<CancelPolicy, { label: string; color: string }> = {
  FREE:            { label: "Free Cancel",     color: "#10B981" },
  MODERATE:        { label: "48h Notice",      color: "#3B82F6" },
  STRICT:          { label: "Strict",          color: "#F59E0B" },
  NON_REFUNDABLE:  { label: "Non-Refundable",  color: "#EF4444" },
};

const MEAL_LABELS: Record<MealPlan, string> = {
  ROOM_ONLY: "Room Only", BED_BREAKFAST: "B&B",
  HALF_BOARD: "Half Board", FULL_BOARD: "Full Board", ALL_INCLUSIVE: "All Inclusive",
};

const fmt = (n: number) => `$${n.toFixed(0)}`;

function mapRatePlan(raw: any): RatePlan {
  return {
    id: raw.id,
    name: raw.name ?? "",
    code: raw.code ?? "",
    type: (raw.type ?? "PUBLIC") as PlanType,
    mealPlan: (raw.mealPlan ?? "ROOM_ONLY") as MealPlan,
    cancellationPolicy: (raw.cancellationPolicy ?? "MODERATE") as CancelPolicy,
    cancellationHours: Number(raw.cancellationHours ?? 48),
    isRefundable: raw.isRefundable ?? true,
    markup: Number(raw.markup ?? 0),
    discount: Number(raw.discount ?? 0),
    minLOS: Number(raw.minLOS ?? raw.minLos ?? 1),
    availableOnline: raw.availableOnline ?? true,
    isActive: raw.isActive ?? true,
    basePrice: Number(raw.basePrice ?? 0),
  };
}

// ─── Generate grid from plans ────────────────────────────────────────────────
function generateGrid(plans: RatePlan[]): RateGrid {
  const grid: RateGrid = {};
  const today = new Date();

  for (const plan of plans) {
    grid[plan.id] = {};
    for (const rt of ROOM_TYPES) {
      grid[plan.id][rt.code] = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(today); d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const dow = d.getDay();
        const isWeekend = dow === 5 || dow === 6;

        let price = plan.basePrice > 0 ? Number(plan.basePrice) : rt.basePrice;
        price *= (1 + plan.markup / 100);
        price *= (1 - plan.discount / 100);
        if (isWeekend) price *= 1.2;
        price += (Math.sin(i * 0.7 + plan.id.charCodeAt(plan.id.length - 1)) * 15);
        price = Math.max(rt.basePrice * 0.5, Math.round(price));

        grid[plan.id][rt.code][dateStr] = {
          price,
          available: isWeekend ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 8) + 3,
          closed: false,
          closedToArrival: false,
          closedToDeparture: false,
        };
      }
    }
  }
  return grid;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function PlanCard({ plan, selected, onClick }: { plan: RatePlan; selected: boolean; onClick: () => void }) {
  const tc = TYPE_CFG[plan.type] ?? TYPE_CFG.PUBLIC;
  const cc = CANCEL_CFG[plan.cancellationPolicy] ?? CANCEL_CFG.MODERATE;

  return (
    <button onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selected ? "border-blue-400 bg-blue-50/50" : "border-slate-100 bg-white hover:border-slate-200"}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-slate-900 text-sm">{plan.name}</div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{plan.code}</div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tc.color + "15", color: tc.color }}>
          {tc.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{MEAL_LABELS[plan.mealPlan] ?? plan.mealPlan}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: cc.color + "12", color: cc.color }}>{cc.label}</span>
        {plan.discount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold">-{plan.discount}%</span>}
        {plan.markup > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">+{plan.markup}%</span>}
        {plan.minLOS > 1 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">Min {plan.minLOS}n</span>}
      </div>
    </button>
  );
}

function RateCell({
  rate, basePrice, isEditing, onSave, onEdit
}: {
  rate: DailyRate | undefined;
  basePrice: number;
  isEditing: boolean;
  onSave: (price: number, available: number) => void;
  onEdit: () => void;
}) {
  const [editPrice, setEditPrice] = useState(rate?.price ?? basePrice);
  const [editAvail, setEditAvail] = useState(rate?.available ?? 10);

  if (!rate) {
    return (
      <td className="border border-slate-100 p-0">
        <button onClick={onEdit} className="w-full h-full min-w-[72px] py-2 text-[11px] text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-colors">
          {fmt(basePrice)}
        </button>
      </td>
    );
  }

  if (rate.closed) {
    return (
      <td className="border border-slate-100 p-0 bg-slate-100">
        <div className="min-w-[72px] py-2 text-center text-[10px] text-slate-400 font-bold">CLOSED</div>
      </td>
    );
  }

  const priceDiff = rate.price - basePrice;
  const pricePct = basePrice > 0 ? Math.round((priceDiff / basePrice) * 100) : 0;
  const isHigh = priceDiff > 0;
  const availColor = rate.available === 0 ? "#EF4444" : rate.available <= 2 ? "#F59E0B" : "#10B981";

  if (isEditing) {
    return (
      <td className="border-2 border-blue-400 p-1 bg-blue-50 z-10 relative">
        <div className="min-w-[90px] space-y-1">
          <input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))}
            className="w-full text-xs font-bold text-center border border-blue-300 rounded px-1 py-0.5 bg-white focus:outline-none"
            autoFocus onKeyDown={e => e.key === "Enter" && onSave(editPrice, editAvail)} />
          <input type="number" value={editAvail} onChange={e => setEditAvail(Number(e.target.value))}
            className="w-full text-[10px] text-center border border-blue-200 rounded px-1 py-0.5 bg-white focus:outline-none"
            placeholder="avail" onKeyDown={e => e.key === "Enter" && onSave(editPrice, editAvail)} />
          <div className="flex gap-1">
            <button onClick={() => onSave(editPrice, editAvail)} className="flex-1 bg-blue-500 text-white rounded text-[9px] py-0.5"><Check size={9} className="mx-auto" /></button>
            <button onClick={onEdit} className="flex-1 bg-slate-200 rounded text-[9px] py-0.5"><X size={9} className="mx-auto" /></button>
          </div>
        </div>
      </td>
    );
  }

  return (
    <td className="border border-slate-100 p-0 group">
      <button onClick={onEdit} className="w-full min-w-[72px] py-1.5 px-2 text-left hover:bg-blue-50/40 transition-colors">
        <div className="text-xs font-bold text-slate-900">{fmt(rate.price)}</div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-semibold" style={{ color: availColor }}>
            {rate.available} avail
          </span>
          {priceDiff !== 0 && (
            <span className={`text-[9px] font-bold ${isHigh ? "text-emerald-600" : "text-red-500"}`}>
              {isHigh ? "+" : ""}{pricePct}%
            </span>
          )}
        </div>
        {(rate.closedToArrival || rate.closedToDeparture) && (
          <div className="flex gap-0.5 mt-0.5">
            {rate.closedToArrival && <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded">CTA</span>}
            {rate.closedToDeparture && <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded">CTD</span>}
          </div>
        )}
      </button>
    </td>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function RatesPage() {
  const [plans, setPlans] = useState<RatePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
  const [grid, setGrid] = useState<RateGrid>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingCell, setEditingCell] = useState<{ roomType: string; date: string } | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkForm, setBulkForm] = useState({ roomTypeCode: "DLX", price: 0, dateFrom: "", dateTo: "", daysOfWeek: [] as number[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.rates.list()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data.rates ?? data.data ?? []);
        const mapped = list.map(mapRatePlan);
        setPlans(mapped);
        if (mapped.length > 0) {
          setSelectedPlan(mapped[0]);
        }
        setGrid(generateGrid(mapped));
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load rate plans");
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute visible dates (14 days from today + weekOffset*7)
  const dates = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + weekOffset * 7 + i);
      return d;
    });
  }, [weekOffset]);

  const handleSaveRate = (roomTypeCode: string, dateStr: string, price: number, available: number) => {
    if (!selectedPlan) return;
    setGrid(g => ({
      ...g,
      [selectedPlan.id]: {
        ...g[selectedPlan.id],
        [roomTypeCode]: {
          ...g[selectedPlan.id]?.[roomTypeCode],
          [dateStr]: {
            ...g[selectedPlan.id]?.[roomTypeCode]?.[dateStr],
            price, available, closed: false,
            closedToArrival: false, closedToDeparture: false,
          },
        },
      },
    }));
    setEditingCell(null);
  };

  const handleBulkUpdate = () => {
    if (!selectedPlan || !bulkForm.price || !bulkForm.dateFrom || !bulkForm.dateTo) return;
    const from = new Date(bulkForm.dateFrom);
    const to = new Date(bulkForm.dateTo);
    let cur = new Date(from);
    const updates: Record<string, DailyRate> = {};
    while (cur <= to) {
      const dow = cur.getDay();
      if (!bulkForm.daysOfWeek.length || bulkForm.daysOfWeek.includes(dow)) {
        const ds = cur.toISOString().split("T")[0];
        updates[ds] = { price: bulkForm.price, available: 10, closed: false, closedToArrival: false, closedToDeparture: false };
      }
      cur.setDate(cur.getDate() + 1);
    }
    setGrid(g => ({
      ...g,
      [selectedPlan.id]: {
        ...g[selectedPlan.id],
        [bulkForm.roomTypeCode]: {
          ...g[selectedPlan.id]?.[bulkForm.roomTypeCode],
          ...updates,
        },
      },
    }));
    setShowBulkUpdate(false);
  };

  const toggleDow = (d: number) => {
    setBulkForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter(x => x !== d) : [...f.daysOfWeek, d],
    }));
  };

  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-sm text-slate-400 mt-4">Loading rate plans...</p>
        </div>
      </div>
    );
  }

  if (error && plans.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-red-300 mb-2" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <TrendingUp size={32} className="mx-auto text-slate-300 mb-2" />
          <h3 className="font-bold text-slate-700 text-lg">No Rate Plans</h3>
          <p className="text-sm text-slate-400 mt-1">Create your first rate plan to get started.</p>
          <button onClick={() => setShowNewPlan(true)} className="btn-primary text-sm mt-4">
            <Plus size={14} /> New Rate Plan
          </button>
        </div>
      </div>
    );
  }

  const activePlan = selectedPlan ?? plans[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Plans sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Rate Plans</h3>
            <button onClick={() => setShowNewPlan(true)} className="btn-primary text-xs py-1.5 flex items-center gap-1">
              <Plus size={12} /> New
            </button>
          </div>
          <div className="space-y-2">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} selected={activePlan.id === plan.id} onClick={() => setSelectedPlan(plan)} />
            ))}
          </div>
        </div>

        {/* Rate grid */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-slate-900">{activePlan.name}</h3>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                <span className="font-mono">{activePlan.code}</span>
                <span>{MEAL_LABELS[activePlan.mealPlan] ?? activePlan.mealPlan}</span>
                {activePlan.discount > 0 && <span className="text-red-500 font-semibold">-{activePlan.discount}% discount</span>}
                {activePlan.markup > 0 && <span className="text-emerald-500 font-semibold">+{activePlan.markup}% markup</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowBulkUpdate(true)} className="btn-ghost text-xs flex items-center gap-1.5">
                <TrendingUp size={12} /> Bulk Update
              </button>
              <button className="btn-ghost text-xs flex items-center gap-1.5">
                <Copy size={12} /> Clone Plan
              </button>
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all">
                  <ChevronLeft size={13} className="text-slate-600" />
                </button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  {dates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                  {dates[13].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all">
                  <ChevronRight size={13} className="text-slate-600" />
                </button>
                {weekOffset !== 0 && (
                  <button onClick={() => setWeekOffset(0)} className="text-[10px] text-blue-500 font-semibold px-2 hover:underline">Today</button>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-xs font-bold text-slate-400 px-4 py-2.5 border-r border-slate-100 sticky left-0 bg-slate-50 min-w-[110px]">
                      Room Type
                    </th>
                    {dates.map(d => {
                      const isToday = d.toDateString() === new Date().toDateString();
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <th key={d.toISOString()} className={`text-center px-1 py-2 border-l border-slate-100 min-w-[72px] ${isWeekend ? "bg-slate-100/70" : ""}`}>
                          <div className={`text-[10px] font-bold ${isToday ? "text-blue-500" : isWeekend ? "text-slate-600" : "text-slate-400"}`}>
                            {d.toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                          <div className={`text-[11px] font-extrabold ${isToday ? "text-blue-600" : "text-slate-700"}`}>
                            {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          {isToday && <div className="w-1 h-1 bg-blue-500 rounded-full mx-auto mt-0.5" />}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {ROOM_TYPES.map(rt => (
                    <tr key={rt.code}>
                      <td className="border-r border-slate-100 px-4 py-2 sticky left-0 bg-white">
                        <div className="text-xs font-bold text-slate-900">{rt.name}</div>
                        <div className="text-[10px] text-slate-400">Base: {fmt(rt.basePrice)}</div>
                      </td>
                      {dates.map(d => {
                        const dateStr = d.toISOString().split("T")[0];
                        const rate = grid[activePlan.id]?.[rt.code]?.[dateStr];
                        const isEditing = editingCell?.roomType === rt.code && editingCell?.date === dateStr;
                        return (
                          <RateCell
                            key={dateStr}
                            rate={rate}
                            basePrice={rt.basePrice}
                            isEditing={isEditing}
                            onEdit={() => setEditingCell(isEditing ? null : { roomType: rt.code, date: dateStr })}
                            onSave={(price, avail) => handleSaveRate(rt.code, dateStr, price, avail)}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-[10px] text-slate-400">
            <span>Click any cell to edit price and availability</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Good availability</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Low (≤2)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Sold out</span>
            <span>CTA = Closed to Arrival · CTD = Closed to Departure</span>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Bulk Update Rates</h3>
              <button onClick={() => setShowBulkUpdate(false)}><X size={14} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Room Type</label>
                  <select value={bulkForm.roomTypeCode} onChange={e => setBulkForm(f => ({ ...f, roomTypeCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    {ROOM_TYPES.map(rt => <option key={rt.code} value={rt.code}>{rt.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">New Price *</label>
                  <input type="number" min={0} value={bulkForm.price || ""} onChange={e => setBulkForm(f => ({ ...f, price: Number(e.target.value) }))}
                    placeholder="$0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">From *</label>
                  <input type="date" value={bulkForm.dateFrom} onChange={e => setBulkForm(f => ({ ...f, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">To *</label>
                  <input type="date" value={bulkForm.dateTo} onChange={e => setBulkForm(f => ({ ...f, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-2">Apply to days (leave empty = all days)</label>
                <div className="flex gap-1.5">
                  {DAYS.map((day, i) => (
                    <button key={day} onClick={() => toggleDow(i)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${bulkForm.daysOfWeek.includes(i) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {bulkForm.price > 0 && bulkForm.dateFrom && bulkForm.dateTo && (
                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                  Will set <strong>{fmt(bulkForm.price)}</strong> for{" "}
                  <strong>{ROOM_TYPES.find(r => r.code === bulkForm.roomTypeCode)?.name}</strong>{" "}
                  from {bulkForm.dateFrom} to {bulkForm.dateTo}
                  {bulkForm.daysOfWeek.length > 0 && ` on ${bulkForm.daysOfWeek.map(d => DAYS[d]).join(", ")} only`}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowBulkUpdate(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleBulkUpdate} className="flex-[2] py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold">Apply Rates</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Rate Plan Modal (simplified) */}
      {showNewPlan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">New Rate Plan</h3>
              <button onClick={() => setShowNewPlan(false)}><X size={14} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Plan Name *", key: "name", placeholder: "e.g. Summer Special" },
                { label: "Code *", key: "code", placeholder: "e.g. SUM25" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
                  <input placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Type</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Discount %</label>
                  <input type="number" min={0} max={100} placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewPlan(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={() => setShowNewPlan(false)} className="flex-[2] py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold">Create Plan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
