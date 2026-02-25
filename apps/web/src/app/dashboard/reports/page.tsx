"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, BedDouble, Users, Calendar, Download, Filter, Loader2, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

function getDaysForPeriod(period: string): number {
  switch (period) {
    case "today": return 1;
    case "week": return 7;
    case "month": return 30;
    case "year": return 365;
    default: return 7;
  }
}

function formatDateParam(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DEPARTMENTS = ["ROOMS", "FB", "SPA", "PARKING", "LAUNDRY", "ADMIN", "MARKETING", "MAINTENANCE", "ENERGY"];
const CATEGORIES = ["LABOR", "SUPPLIES", "CONTRACTED", "OTHER"];
const DEPT_LABELS: Record<string, string> = {
  rooms: "Rooms Department", fb: "Food & Beverage", spa: "Spa", parking: "Parking",
  laundry: "Laundry", telephone: "Telephone", admin: "Administrative & General",
  marketing: "Sales & Marketing", maintenance: "Property Maintenance", energy: "Energy / Utilities",
};

// ─── USALI Tab Component ──────────────────────────────────────────────────

function UsaliTab() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [report, setReport] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ rooms: true, fb: true });

  // Expense form
  const [expDept, setExpDept] = useState("ROOMS");
  const [expCat, setExpCat] = useState("LABOR");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      const from = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const [usali, exp] = await Promise.all([
        api.reports.usali(from, to).catch(() => null),
        api.reports.usaliExpenses({ month: from }).catch(() => []),
      ]);
      setReport(usali);
      setExpenses(Array.isArray(exp) ? exp : []);
    } catch (err) {
      console.error("Failed to load USALI data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || !expAmount) return;
    setSubmitting(true);
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      await api.reports.addExpense({
        department: expDept,
        category: expCat,
        description: expDesc,
        amount: parseFloat(expAmount),
        month: `${y}-${String(m).padStart(2, "0")}-01`,
      });
      setExpDesc("");
      setExpAmount("");
      await loadData();
    } catch (err) {
      console.error("Failed to add expense:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.reports.deleteExpense(id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={28} />
        <span className="ml-3 text-slate-500 text-sm">Loading USALI report...</span>
      </div>
    );
  }

  const kpis = report?.kpis || {};
  const depts = report?.departments || {};
  const undist = report?.undistributed || {};

  // Generate month options (last 12 months)
  const monthOptions: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
  }

  const renderDeptRow = (key: string, dept: any) => {
    const isExpanded = expanded[key];
    const expEntries = Object.entries(dept?.expenses || {});
    return (
      <div key={key} className="border-b border-slate-100">
        <button onClick={() => toggle(key)} className="w-full flex items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
            <span className="font-medium text-slate-900">{DEPT_LABELS[key] || key}</span>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <span className="w-28 text-right text-green-700 font-medium">${fmt(dept?.revenue || 0)}</span>
            <span className="w-28 text-right text-red-600">(${fmt(dept?.totalExpenses || 0)})</span>
            <span className="w-28 text-right font-bold text-slate-900">${fmt(dept?.profit || 0)}</span>
          </div>
        </button>
        {isExpanded && expEntries.length > 0 && (
          <div className="pb-2 px-4 pl-10 space-y-1">
            {expEntries.map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between text-sm text-slate-500 py-0.5">
                <span className="capitalize">{cat}</span>
                <div className="flex items-center gap-8">
                  <span className="w-28" />
                  <span className="w-28 text-right text-red-500">(${fmt(val as number)})</span>
                  <span className="w-28" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Month Picker */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-slate-600 font-medium">Period:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
        >
          {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Room Nights Sold", value: String(kpis.roomNightsSold ?? 0) },
          { label: "Occupancy", value: `${kpis.occupancy ?? 0}%` },
          { label: "ADR", value: `$${fmt(kpis.adr ?? 0)}` },
          { label: "RevPAR", value: `$${fmt(kpis.revpar ?? 0)}` },
          { label: "GOP", value: `$${fmt(report?.gop ?? 0)}` },
          { label: "GOP Margin", value: `${report?.gopMargin ?? 0}%` },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">{k.label}</div>
            <div className="text-lg font-bold text-slate-900">{k.value}</div>
          </div>
        ))}
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">USALI Summary Operating Statement</h3>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between py-2 px-4 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <span>Department</span>
          <div className="flex items-center gap-8">
            <span className="w-28 text-right">Revenue</span>
            <span className="w-28 text-right">Expenses</span>
            <span className="w-28 text-right">Profit</span>
          </div>
        </div>

        {/* Operated Departments */}
        {["rooms", "fb"].map(k => depts[k] && renderDeptRow(k, depts[k]))}

        {/* Other Operated */}
        {["spa", "parking", "laundry", "telephone"].map(k => depts[k] && (depts[k].revenue > 0 || depts[k].totalExpenses > 0) && renderDeptRow(k, depts[k]))}

        {/* Total Departmental */}
        <div className="flex items-center justify-between py-3 px-4 bg-blue-50 border-y border-blue-100 font-semibold">
          <span className="text-blue-900">Total Departmental Profit</span>
          <div className="flex items-center gap-8 text-sm">
            <span className="w-28 text-right text-green-700">${fmt(report?.totalRevenue ?? 0)}</span>
            <span className="w-28 text-right text-red-600">(${fmt(report?.totalDeptExpenses ?? 0)})</span>
            <span className="w-28 text-right text-blue-900 font-bold">${fmt(report?.totalDeptProfit ?? 0)}</span>
          </div>
        </div>

        {/* Undistributed Operating Expenses */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Undistributed Operating Expenses</span>
        </div>
        {["admin", "marketing", "maintenance", "energy"].map(k => (
          undist[k] > 0 && (
            <div key={k} className="flex items-center justify-between py-2 px-4 pl-10 text-sm">
              <span className="text-slate-600">{DEPT_LABELS[k] || k}</span>
              <div className="flex items-center gap-8">
                <span className="w-28" />
                <span className="w-28 text-right text-red-600">(${fmt(undist[k])})</span>
                <span className="w-28" />
              </div>
            </div>
          )
        ))}
        <div className="flex items-center justify-between py-2 px-4 text-sm border-t border-slate-100">
          <span className="font-medium text-slate-700">Total Undistributed</span>
          <div className="flex items-center gap-8">
            <span className="w-28" />
            <span className="w-28 text-right text-red-600 font-medium">(${fmt(undist.total ?? 0)})</span>
            <span className="w-28" />
          </div>
        </div>

        {/* GOP */}
        <div className="flex items-center justify-between py-3 px-4 bg-green-50 border-y border-green-100 font-bold">
          <span className="text-green-900">Gross Operating Profit (GOP)</span>
          <div className="flex items-center gap-8 text-sm">
            <span className="w-28" />
            <span className="w-28" />
            <span className="w-28 text-right text-green-900 text-base">${fmt(report?.gop ?? 0)}</span>
          </div>
        </div>

        {/* Taxes & Fees */}
        {((report?.taxes?.propertyTax ?? 0) > 0 || (report?.taxes?.cityTax ?? 0) > 0 || (report?.resortFees ?? 0) > 0) && (
          <>
            <div className="px-4 pt-3 pb-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Taxes & Fees Collected</span>
            </div>
            {(report?.taxes?.propertyTax ?? 0) > 0 && (
              <div className="flex items-center justify-between py-2 px-4 pl-10 text-sm">
                <span className="text-slate-600">Property Tax</span>
                <span className="text-slate-700">${fmt(report.taxes.propertyTax)}</span>
              </div>
            )}
            {(report?.taxes?.cityTax ?? 0) > 0 && (
              <div className="flex items-center justify-between py-2 px-4 pl-10 text-sm">
                <span className="text-slate-600">City Tax</span>
                <span className="text-slate-700">${fmt(report.taxes.cityTax)}</span>
              </div>
            )}
            {(report?.resortFees ?? 0) > 0 && (
              <div className="flex items-center justify-between py-2 px-4 pl-10 text-sm">
                <span className="text-slate-600">Resort Fees</span>
                <span className="text-slate-700">${fmt(report.resortFees)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expense Entry Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Department Expenses</h3>

        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="flex items-end gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="flex-shrink-0">
            <label className="block text-xs text-slate-500 mb-1">Department</label>
            <select value={expDept} onChange={e => setExpDept(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex-shrink-0">
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <select value={expCat} onChange={e => setExpCat(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <input type="text" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="e.g. Staff salaries" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
          </div>
          <div className="w-32">
            <label className="block text-xs text-slate-500 mb-1">Amount</label>
            <input type="number" step="0.01" min="0" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
          </div>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
          </button>
        </form>

        {/* Expenses Table */}
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No expenses recorded for this month.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100 uppercase tracking-wide">
                <th className="pb-2 font-medium">Department</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium text-right">Amount</th>
                <th className="pb-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp: any) => (
                <tr key={exp.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 text-sm font-medium text-slate-700">{exp.department}</td>
                  <td className="py-2 text-sm text-slate-600">{exp.category}</td>
                  <td className="py-2 text-sm text-slate-600">{exp.description}</td>
                  <td className="py-2 text-sm text-right font-medium text-slate-900">${fmt(Number(exp.amount))}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "usali">("overview");
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    occupancy: 0, adr: 0, revpar: 0, totalRevenue: 0,
    arrivals: 0, departures: 0, inHouse: 0, available: 0,
  });
  const [occupancyData, setOccupancyData] = useState<{ date: string; occupancy: number; revenue: number }[]>([]);
  const [revenueBySource, setRevenueBySource] = useState<{ source: string; amount: number; pct: number }[]>([]);
  const [roomTypePerf, setRoomTypePerf] = useState<{ type: string; rooms: number; occ: number; adr: number; revpar: number }[]>([]);

  useEffect(() => {
    if (activeTab !== "overview") return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const days = getDaysForPeriod(period);
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - days);
        const fromStr = formatDateParam(from);
        const toStr = formatDateParam(to);

        const [dashboard, occupancy, revenue] = await Promise.all([
          api.reports.dashboard().catch(() => null),
          api.reports.occupancy({ from: fromStr, to: toStr }).catch(() => null),
          api.reports.revenue({ from: fromStr, to: toStr }).catch(() => null),
        ]);

        if (cancelled) return;

        if (dashboard) {
          const totalRooms = Number(dashboard.totalRooms ?? 0);
          const occupiedRooms = Number(dashboard.occupiedRooms ?? 0);
          const monthRevenue = Number(dashboard.monthRevenue ?? 0);
          setStats({
            occupancy: Number(dashboard.occupancyRate ?? 0),
            adr: occupiedRooms > 0 ? monthRevenue / occupiedRooms : 0,
            revpar: totalRooms > 0 ? monthRevenue / totalRooms : 0,
            totalRevenue: monthRevenue,
            arrivals: Number(dashboard.todayArrivals ?? 0),
            departures: Number(dashboard.todayDepartures ?? 0),
            inHouse: occupiedRooms,
            available: totalRooms - occupiedRooms,
          });
        }

        if (occupancy && Array.isArray(occupancy)) {
          setOccupancyData(occupancy.map((d: any) => ({
            date: d.date ? new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }) : d.label ?? "",
            occupancy: Number(d.occupancyRate ?? d.occupancy ?? 0),
            revenue: Number(d.revenue ?? 0),
          })));
        } else if (occupancy && typeof occupancy === "object") {
          const arr = occupancy.daily ?? occupancy.data ?? [];
          if (Array.isArray(arr)) {
            setOccupancyData(arr.map((d: any) => ({
              date: d.date ? new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }) : d.label ?? "",
              occupancy: Number(d.occupancyRate ?? d.occupancy ?? 0),
              revenue: Number(d.revenue ?? 0),
            })));
          }
        }

        if (revenue && Array.isArray(revenue)) {
          const total = revenue.reduce((sum: number, r: any) => sum + Number(r.amount ?? r.revenue ?? 0), 0);
          setRevenueBySource(revenue.map((r: any) => ({
            source: r.source ?? r.channel ?? r.name ?? "Unknown",
            amount: Number(r.amount ?? r.revenue ?? 0),
            pct: total > 0 ? Math.round((Number(r.amount ?? r.revenue ?? 0) / total) * 1000) / 10 : 0,
          })));
        } else if (revenue && typeof revenue === "object") {
          const bySource = revenue.bySource ?? revenue.byChannel ?? revenue.data ?? [];
          if (Array.isArray(bySource)) {
            const total = bySource.reduce((sum: number, r: any) => sum + Number(r.amount ?? r.revenue ?? 0), 0);
            setRevenueBySource(bySource.map((r: any) => ({
              source: r.source ?? r.channel ?? r.name ?? "Unknown",
              amount: Number(r.amount ?? r.revenue ?? 0),
              pct: total > 0 ? Math.round((Number(r.amount ?? r.revenue ?? 0) / total) * 1000) / 10 : 0,
            })));
          }

          const roomTypes = revenue.byRoomType ?? revenue.roomTypes ?? [];
          if (Array.isArray(roomTypes) && roomTypes.length > 0) {
            setRoomTypePerf(roomTypes.map((rt: any) => ({
              type: rt.type ?? rt.roomType ?? rt.name ?? "Unknown",
              rooms: Number(rt.rooms ?? rt.count ?? 0),
              occ: Number(rt.occupancy ?? rt.occ ?? 0),
              adr: Number(rt.adr ?? 0),
              revpar: Number(rt.revpar ?? 0),
            })));
          }
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [period, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Performance overview and insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setActiveTab("overview")} className={`px-3 py-1.5 text-sm rounded-md transition-all ${activeTab === "overview" ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
              Overview
            </button>
            <button onClick={() => setActiveTab("usali")} className={`px-3 py-1.5 text-sm rounded-md transition-all ${activeTab === "usali" ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
              USALI
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="flex bg-slate-100 rounded-lg p-1">
              {["today", "week", "month", "year"].map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-sm rounded-md transition-all ${period === p ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          )}

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {activeTab === "usali" ? (
        <UsaliTab />
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="ml-3 text-slate-500 text-sm">Loading reports...</span>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Occupancy", value: `${stats.occupancy.toFixed(1)}%`, icon: BedDouble, color: "blue" },
                  { label: "ADR", value: `$${stats.adr.toFixed(2)}`, icon: DollarSign, color: "green" },
                  { label: "RevPAR", value: `$${stats.revpar.toFixed(2)}`, icon: TrendingUp, color: "purple" },
                  { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: BarChart3, color: "amber" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 text-sm">{kpi.label}</span>
                      <kpi.icon size={18} className="text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Operations Cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Arrivals Today", value: stats.arrivals, icon: Calendar, color: "bg-blue-50 text-blue-600" },
                  { label: "Departures Today", value: stats.departures, icon: Calendar, color: "bg-amber-50 text-amber-600" },
                  { label: "In-House Guests", value: stats.inHouse, icon: Users, color: "bg-green-50 text-green-600" },
                  { label: "Rooms Available", value: stats.available, icon: BedDouble, color: "bg-purple-50 text-purple-600" },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                      <card.icon size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                      <div className="text-sm text-slate-500">{card.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Occupancy Chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Occupancy & Revenue</h3>
                  {occupancyData.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">No occupancy data available for this period.</div>
                  ) : (
                    <div className="space-y-3">
                      {occupancyData.map((day, i) => (
                        <div key={`${day.date}-${i}`} className="flex items-center gap-3">
                          <span className="text-sm text-slate-500 w-8">{day.date}</span>
                          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(day.occupancy, 100)}%` }} />
                          </div>
                          <span className="text-sm font-medium text-slate-700 w-10 text-right">{day.occupancy}%</span>
                          <span className="text-sm text-slate-500 w-20 text-right">${Number(day.revenue).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Revenue by Source */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Revenue by Source</h3>
                  {revenueBySource.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">No revenue source data available for this period.</div>
                  ) : (
                    <div className="space-y-4">
                      {revenueBySource.map(src => (
                        <div key={src.source}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-700">{src.source}</span>
                            <span className="text-sm font-medium text-slate-900">${Number(src.amount).toLocaleString()} ({src.pct}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(src.pct, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Room Type Performance */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Room Type Performance</h3>
                {roomTypePerf.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No room type performance data available.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                        <th className="pb-3 font-medium">Room Type</th>
                        <th className="pb-3 font-medium text-center">Rooms</th>
                        <th className="pb-3 font-medium text-center">Occupancy</th>
                        <th className="pb-3 font-medium text-right">ADR</th>
                        <th className="pb-3 font-medium text-right">RevPAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomTypePerf.map(rt => (
                        <tr key={rt.type} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-3 font-medium text-slate-900">{rt.type}</td>
                          <td className="py-3 text-center text-slate-600">{rt.rooms}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rt.occ >= 80 ? "bg-green-50 text-green-700" : rt.occ >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                              {rt.occ}%
                            </span>
                          </td>
                          <td className="py-3 text-right text-slate-600">${Number(rt.adr).toLocaleString()}</td>
                          <td className="py-3 text-right font-medium text-slate-900">${Number(rt.revpar).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
