"use client";
import { useState, useEffect } from "react";
import { Building2, DollarSign, BedDouble, BarChart3, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    api.portfolio.dashboard()
      .then((res: any) => {
        // Response could be { properties: [...] } or an array directly
        const list = Array.isArray(res) ? res : Array.isArray(res?.properties) ? res.properties : [];
        setProperties(list);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const mapped = properties.map((p: any) => ({
    id: p.id,
    name: p.name || "Unnamed Property",
    city: p.city || p.location || "—",
    rooms: Number(p.rooms ?? p.totalRooms ?? 0),
    occupancy: Number(p.occupancy ?? p.occupancyRate ?? 0),
    adr: Number(p.adr ?? p.averageDailyRate ?? 0),
    revpar: Number(p.revpar ?? p.revPar ?? 0),
    revenue: Number(p.revenue ?? p.totalRevenue ?? 0),
    change: Number(p.change ?? p.trend ?? 0),
  }));

  const totals = {
    properties: mapped.length,
    rooms: mapped.reduce((s, p) => s + p.rooms, 0),
    avgOccupancy: mapped.length > 0 ? Math.round(mapped.reduce((s, p) => s + p.occupancy, 0) / mapped.length) : 0,
    totalRevenue: mapped.reduce((s, p) => s + p.revenue, 0),
    avgAdr: mapped.length > 0 ? Math.round(mapped.reduce((s, p) => s + p.adr, 0) / mapped.length) : 0,
    avgRevpar: mapped.length > 0 ? Math.round(mapped.reduce((s, p) => s + p.revpar * 10, 0) / mapped.length) / 10 : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portfolio Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Multi-property performance dashboard</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Properties", value: totals.properties, icon: Building2, color: "bg-blue-50 text-blue-600" },
          { label: "Total Rooms", value: totals.rooms, icon: BedDouble, color: "bg-purple-50 text-purple-600" },
          { label: "Avg Occupancy", value: `${totals.avgOccupancy}%`, icon: BarChart3, color: "bg-green-50 text-green-600" },
          { label: "Total Revenue", value: `$${totals.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-amber-50 text-amber-600" },
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

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Property Performance</h3>
        </div>
        {mapped.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Properties</h3>
            <p className="text-sm text-slate-500">Portfolio data will appear here once multiple properties are configured.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium text-center">Rooms</th>
                <th className="px-4 py-3 font-medium text-center">Occupancy</th>
                <th className="px-4 py-3 font-medium text-right">ADR</th>
                <th className="px-4 py-3 font-medium text-right">RevPAR</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                <th className="px-4 py-3 font-medium text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {mapped.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.city}</div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-600">{p.rooms}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.occupancy >= 80 ? "bg-green-50 text-green-700" : p.occupancy >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                      {p.occupancy}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-slate-600">${p.adr}</td>
                  <td className="px-4 py-4 text-right font-medium text-slate-900">${p.revpar}</td>
                  <td className="px-4 py-4 text-right font-medium text-slate-900">${p.revenue.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right">
                    {p.change !== 0 ? (
                      <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${p.change > 0 ? "text-green-600" : "text-red-600"}`}>
                        {p.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(p.change)}%
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-medium text-slate-900">
                <td className="px-4 py-3">Portfolio Total</td>
                <td className="px-4 py-3 text-center">{totals.rooms}</td>
                <td className="px-4 py-3 text-center">{totals.avgOccupancy}%</td>
                <td className="px-4 py-3 text-right">${totals.avgAdr}</td>
                <td className="px-4 py-3 text-right">${totals.avgRevpar}</td>
                <td className="px-4 py-3 text-right">${totals.totalRevenue.toLocaleString()}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
