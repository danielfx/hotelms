"use client";
import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, BarChart3, Zap, Target, ArrowUp, ArrowDown, Brain, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function RevenuePage() {
  const [tab, setTab] = useState<"recommendations" | "forecast" | "rules">("recommendations");
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    const from = now.toISOString().split("T")[0];
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const to = futureDate.toISOString().split("T")[0];
    const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const pastFrom = pastDate.toISOString().split("T")[0];

    Promise.allSettled([
      api.revenue.listRules(),
      api.revenue.forecast(from, to),
      api.revenue.recommendations(pastFrom, from),
    ]).then(([rulesRes, forecastRes, recsRes]) => {
      if (rulesRes.status === "fulfilled") setRules(Array.isArray(rulesRes.value) ? rulesRes.value : []);
      if (forecastRes.status === "fulfilled") setForecast(Array.isArray(forecastRes.value) ? forecastRes.value : []);
      if (recsRes.status === "fulfilled") setRecommendations(Array.isArray(recsRes.value) ? recsRes.value : []);
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

  // Map rules to UI shape
  const mappedRules = rules.map((r: any) => {
    const val = Number(r.adjustmentValue ?? r.adjustment ?? 0);
    const isPercentage = (r.adjustmentType ?? r.type) === "PERCENTAGE";
    const suffix = isPercentage ? "%" : "";
    return {
      id: r.id,
      name: r.name || "Unnamed Rule",
      type: r.description || r.adjustmentType || "—",
      adjustment: val >= 0 ? `+${val}${suffix}` : `${val}${suffix}`,
      active: r.isActive ?? r.active ?? r.enabled ?? false,
    };
  });

  // Map forecast to UI shape
  const mappedForecast = forecast.map((f: any) => {
    const d = f.date ? new Date(f.date) : null;
    const label = d ? d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }) : "—";
    const rawOcc = Number(f.predictedOccupancy ?? f.demand ?? f.occupancyForecast ?? 0);
    // Backend stores occupancy as 0-1 decimal; convert to percentage
    const demand = rawOcc <= 1 ? Math.round(rawOcc * 100) : Math.round(rawOcc);
    return {
      date: label,
      demand,
      recommended: Math.round(Number(f.predictedADR ?? f.recommendedRate ?? f.recommended ?? 0)),
      current: Math.round(Number(f.predictedRevPAR ?? f.currentRate ?? f.current ?? 0)),
      demandLevel: f.demandLevel || "NORMAL",
    };
  });

  // Map recommendations to UI shape
  const mappedRecs = recommendations.map((r: any) => {
    const rawConf = Number(r.confidence ?? 0);
    // Backend stores confidence as 0-1 decimal; convert to percentage
    const confidence = rawConf <= 1 ? Math.round(rawConf * 100) : Math.round(rawConf);
    const currentRate = Math.round(Number(r.currentRate ?? 0));
    const recommendedRate = Math.round(Number(r.recommendedRate ?? 0));
    const diff = recommendedRate - currentRate;
    const pctChange = currentRate > 0 ? Math.round((diff / currentRate) * 100) : 0;
    return {
      id: r.id,
      roomType: r.roomTypeCode || r.roomType || r.roomTypeName || "Unknown",
      currentRate,
      recommendedRate,
      reason: r.reason || r.description || "—",
      confidence,
      impact: r.impact || (diff > 0 ? `+${pctChange}%` : `${pctChange}%`),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered pricing and demand forecasting</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pricing Rules", value: String(mappedRules.length), change: `${mappedRules.filter(r => r.active).length} active`, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
          { label: "Recommendations", value: String(mappedRecs.length), change: "AI suggestions", icon: DollarSign, color: "bg-green-50 text-green-600" },
          { label: "Forecast Days", value: String(mappedForecast.length), change: "upcoming", icon: Zap, color: "bg-amber-50 text-amber-600" },
          { label: "Avg Demand", value: mappedForecast.length > 0 ? `${Math.round(mappedForecast.reduce((s, f) => s + f.demand, 0) / mappedForecast.length)}%` : "—", change: "forecast period", icon: Target, color: "bg-purple-50 text-purple-600" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpi.color}`}><kpi.icon size={22} /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-xs text-slate-500">{kpi.change}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["recommendations", "forecast", "rules"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "recommendations" && (
        <div className="space-y-4">
          {mappedRecs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Brain size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Recommendations Yet</h3>
              <p className="text-sm text-slate-500">AI recommendations will appear here once enough data is available.</p>
            </div>
          ) : mappedRecs.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Brain size={20} className="text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{r.roomType}</h3>
                    <p className="text-sm text-slate-500">{r.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Current</div>
                    <div className="font-bold text-slate-900">${r.currentRate}</div>
                  </div>
                  {r.recommendedRate !== r.currentRate && (
                    <>
                      <div className={r.recommendedRate > r.currentRate ? "text-green-500" : "text-red-500"}>
                        {r.recommendedRate > r.currentRate ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500">Recommended</div>
                        <div className={`font-bold ${r.recommendedRate > r.currentRate ? "text-green-600" : "text-amber-600"}`}>${r.recommendedRate}</div>
                      </div>
                    </>
                  )}
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Impact</div>
                    <div className="font-medium text-blue-600">{r.impact}</div>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <div className="text-sm text-slate-500">Confidence</div>
                    <div className="font-bold text-slate-900">{r.confidence}%</div>
                  </div>
                  {r.recommendedRate !== r.currentRate && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Apply</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "forecast" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Demand Forecast</h3>
          {mappedForecast.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart3 size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Forecast Data</h3>
              <p className="text-sm text-slate-500">Demand forecasts will appear here once sufficient booking data is available.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mappedForecast.map(d => (
                <div key={d.date} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600 w-20">{d.date}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 w-16">Demand</span>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${d.demand >= 90 ? "bg-red-400" : d.demand >= 70 ? "bg-amber-400" : "bg-blue-400"}`} style={{ width: `${Math.min(d.demand, 100)}%` }} />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{d.demand}%</span>
                    </div>
                  </div>
                  <div className="text-right w-24">
                    <div className="text-xs text-slate-500">RevPAR</div>
                    <div className="text-sm text-slate-700">${d.current}</div>
                  </div>
                  <div className="text-right w-28">
                    <div className="text-xs text-slate-500">ADR</div>
                    <div className={`text-sm font-bold ${d.recommended > d.current ? "text-green-600" : d.recommended < d.current ? "text-amber-600" : "text-slate-700"}`}>${d.recommended}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "rules" && (
        <div className="bg-white rounded-xl border border-slate-200">
          {mappedRules.length === 0 ? (
            <div className="py-12 text-center">
              <Zap size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Pricing Rules</h3>
              <p className="text-sm text-slate-500">Create pricing rules to automate rate adjustments based on demand and occupancy.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="p-4 font-medium">Rule Name</th>
                  <th className="p-4 font-medium">Condition</th>
                  <th className="p-4 font-medium">Adjustment</th>
                  <th className="p-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {mappedRules.map(rule => (
                  <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{rule.name}</td>
                    <td className="p-4 text-sm text-slate-600">{rule.type}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-sm font-medium ${rule.adjustment.startsWith("+") ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{rule.adjustment}</span></td>
                    <td className="p-4 text-center">
                      <button className={`w-10 h-6 rounded-full transition-colors ${rule.active ? "bg-blue-600" : "bg-slate-200"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.active ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
