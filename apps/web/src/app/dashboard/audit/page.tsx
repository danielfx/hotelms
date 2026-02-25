"use client";
import { useState, useEffect } from "react";
import { Shield, Search, Download, Users, AlertTriangle, Eye, Clock, Filter } from "lucide-react";
import api from "@/lib/api";

const actionColors: Record<string, string> = {
  LOGIN_SUCCESS: "bg-green-50 text-green-700",
  LOGIN_FAILED: "bg-red-50 text-red-700",
  RESERVATION_CREATED: "bg-blue-50 text-blue-700",
  RATE_UPDATED: "bg-amber-50 text-amber-700",
  GUEST_CHECKOUT: "bg-purple-50 text-purple-700",
  FOLIO_CHARGE: "bg-cyan-50 text-cyan-700",
  USER_CREATED: "bg-emerald-50 text-emerald-700",
  ROOM_STATUS_CHANGE: "bg-slate-100 text-slate-700",
};

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [logsRes, statsRes] = await Promise.all([
          api.audit.searchLogs().catch(() => []),
          api.audit.logStats().catch(() => null),
        ]);
        // searchLogs may return { logs: [...] }, { items: [...] }, or an array
        if (Array.isArray(logsRes)) {
          setLogs(logsRes);
        } else if (logsRes && Array.isArray(logsRes.logs)) {
          setLogs(logsRes.logs);
        } else if (logsRes && Array.isArray(logsRes.items)) {
          setLogs(logsRes.items);
        } else {
          setLogs([]);
        }
        setStats(statsRes);
      } catch {
        // fallback to empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredLogs = logs.filter(l => {
    const userStr = typeof l.user === "object" && l.user ? (l.user.name || l.user.email || "") : (l.user || l.userEmail || "");
    return (l.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      userStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.details || l.description || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit & Security</h1>
          <p className="text-slate-500 text-sm mt-1">Activity logs, security monitoring, and compliance</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit & Security</h1>
          <p className="text-slate-500 text-sm mt-1">Activity logs, security monitoring, and compliance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700">
          <Download size={16} /> Export Logs
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Events (24h)", value: stats?.totalLogs24h ?? stats?.events24h ?? stats?.totalEvents ?? 0, icon: Eye, color: "bg-blue-50 text-blue-600" },
          { label: "Failed Logins", value: stats?.failedLogins24h ?? stats?.failedLogins ?? 0, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
          { label: "Active Users", value: stats?.activeUsers ?? 0, icon: Users, color: "bg-green-50 text-green-600" },
          { label: "Weekly Events", value: stats?.totalLogsWeek ?? stats?.weeklyEvents ?? 0, icon: Clock, color: "bg-purple-50 text-purple-600" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpi.color}`}><kpi.icon size={22} /></div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}</div>
              <div className="text-sm text-slate-500">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search logs by action, user, or details..."
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Filter size={14} /> Filter
          </button>
        </div>
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No audit logs found</h3>
            <p className="text-sm text-slate-500">{searchQuery ? "Try adjusting your search query." : "Activity logs will appear here as actions are performed."}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log: any, idx: number) => (
                <tr key={log.id || idx} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{log.timestamp || log.createdAt ? new Date(log.timestamp || log.createdAt).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || "bg-slate-100 text-slate-600"}`}>
                      {log.action || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{(typeof log.user === "object" && log.user ? (log.user.name || log.user.email) : log.user) || log.userEmail || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.details || log.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
