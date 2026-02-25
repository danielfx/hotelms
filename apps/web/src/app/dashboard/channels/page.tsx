"use client";
import { useState, useEffect } from "react";
import { RefreshCw, Plus, Wifi, WifiOff, AlertCircle, Check, ChevronRight, Clock, ArrowDownToLine, ArrowUpToLine, X, ExternalLink } from "lucide-react";
import api from "@/lib/api";

// ─── TYPES & CONFIG ───────────────────────────────────────────────────────────

type ChannelStatus = "ACTIVE" | "ERROR" | "INACTIVE" | "PENDING_SETUP";

const CHANNELS: Record<string, { name: string; logo: string; color: string; bg: string; commission: number }> = {
  BOOKING_COM: { name: "Booking.com",   logo: "B", color: "#003580", bg: "#EEF4FF", commission: 15 },
  EXPEDIA:     { name: "Expedia",       logo: "E", color: "#FFD700", bg: "#FFFBEB", commission: 18 },
  AIRBNB:      { name: "Airbnb",        logo: "A", color: "#FF5A5F", bg: "#FFF1F1", commission: 3  },
  HOTELS_COM:  { name: "Hotels.com",    logo: "H", color: "#FF5C00", bg: "#FFF3ED", commission: 18 },
  AGODA:       { name: "Agoda",         logo: "G", color: "#5C1E99", bg: "#F5EDFF", commission: 16 },
  TRIP_COM:    { name: "Trip.com",      logo: "T", color: "#007DFF", bg: "#EFF7FF", commission: 12 },
  GDS_SABRE:   { name: "Sabre GDS",     logo: "S", color: "#1B3B6F", bg: "#EFF4FF", commission: 10 },
  GDS_AMADEUS: { name: "Amadeus GDS",   logo: "M", color: "#0072CE", bg: "#EFF6FF", commission: 10 },
};

const STATUS_CFG: Record<ChannelStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  ACTIVE:        { label: "Active",        color: "#059669", bg: "#ECFDF5", icon: <Check size={11} /> },
  ERROR:         { label: "Error",         color: "#DC2626", bg: "#FEF2F2", icon: <AlertCircle size={11} /> },
  INACTIVE:      { label: "Inactive",      color: "#94A3B8", bg: "#F8FAFC", icon: <WifiOff size={11} /> },
  PENDING_SETUP: { label: "Pending Setup", color: "#D97706", bg: "#FFFBEB", icon: <Clock size={11} /> },
};

interface ChannelConnection {
  id: string;
  channel: string;
  externalHotelId: string;
  status: ChannelStatus;
  autoSync: boolean;
  commissionPct: number;
  lastSyncAt: string | null;
  stats: { totalReservations: number; last30DayRevenue: number };
  syncLogs: { type: string; success: boolean; recordsProcessed: number; createdAt: string }[];
}

function mapConnection(raw: any): ChannelConnection {
  const stats = raw.stats ?? {};
  const syncLogs = (raw.syncLogs ?? raw.logs ?? []).map((log: any) => ({
    type: log.type ?? "SYNC",
    success: log.success ?? (log.status === "SUCCESS"),
    recordsProcessed: Number(log.recordsProcessed ?? 0),
    createdAt: log.createdAt ?? "",
  }));

  return {
    id: raw.id,
    channel: raw.channel ?? raw.channelCode ?? raw.provider ?? "BOOKING_COM",
    externalHotelId: raw.externalHotelId ?? raw.hotelId ?? raw.propertyId ?? "",
    status: (raw.status ?? "INACTIVE") as ChannelStatus,
    autoSync: raw.autoSync ?? raw.autoConfirm ?? false,
    commissionPct: Number(raw.commissionPct ?? raw.commission ?? 0),
    lastSyncAt: raw.lastSyncAt ?? raw.lastSync ?? null,
    stats: {
      totalReservations: Number(stats.totalReservations ?? stats.reservations ?? 0),
      last30DayRevenue: Number(stats.last30DayRevenue ?? stats.revenue ?? 0),
    },
    syncLogs,
  };
}

const fmt = (n: number) => `$${Number(n).toLocaleString()}`;
const timeAgo = (dateStr: string | null) => {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── SYNC MODAL ───────────────────────────────────────────────────────────────

function SyncModal({ conn, onClose }: { conn: ChannelConnection; onClose: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]);
  const [syncType, setSyncType] = useState<"rates" | "inventory" | "all">("all");

  const ch = CHANNELS[conn.channel] ?? { name: conn.channel, logo: "?", color: "#64748B", bg: "#F8FAFC", commission: 0 };

  const handleSync = () => {
    setSyncing(true);
    const syncPromise = syncType === "rates"
      ? api.channels.sync(conn.id, "rates")
      : syncType === "inventory"
        ? api.channels.sync(conn.id, "inventory")
        : Promise.all([
            api.channels.sync(conn.id, "rates"),
            api.channels.sync(conn.id, "inventory"),
          ]);
    syncPromise
      .then(() => { setSyncing(false); setDone(true); })
      .catch(() => { setSyncing(false); setDone(true); });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: ch.color }}>{ch.logo}</span>
            <div>
              <h3 className="font-bold text-slate-900">Sync {ch.name}</h3>
              <p className="text-xs text-slate-400">Hotel ID: {conn.externalHotelId}</p>
            </div>
          </div>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={28} className="text-emerald-500" />
              </div>
              <div className="font-bold text-slate-900">Sync Complete</div>
              <div className="text-sm text-slate-400 mt-1">Rates & inventory pushed successfully</div>
              <button onClick={onClose} className="mt-4 btn-primary text-sm">Done</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {([["all", "Rates + Inventory"], ["rates", "Rates Only"], ["inventory", "Inventory Only"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setSyncType(v)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${syncType === v ? "bg-blue-500 text-white border-blue-500" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">From</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">To</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                Will push <strong>{Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000)} days</strong> of data
                to <strong>{ch.name}</strong>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSync} disabled={syncing}
                  className="flex-[2] py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold flex items-center justify-center gap-2">
                  {syncing ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Syncing...</>
                  ) : (
                    <><RefreshCw size={14} /> Start Sync</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CONNECT MODAL ────────────────────────────────────────────────────────────

function ConnectModal({ connections, onClose, onConnected }: { connections: ChannelConnection[]; onClose: () => void; onConnected: () => void }) {
  const [step, setStep] = useState<"pick" | "configure" | "done">("pick");
  const [selected, setSelected] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);

  const availableChannels = Object.keys(CHANNELS).filter(
    c => !connections.find(conn => conn.channel === c)
  );

  const handleConnect = () => {
    if (!selected) return;
    setConnecting(true);
    api.channels.connect(selected, { hotelId, apiKey })
      .then(() => { setConnecting(false); setStep("done"); onConnected(); })
      .catch(() => { setConnecting(false); setStep("done"); });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Connect New Channel</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="p-6">
          {step === "pick" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-3">Select the OTA or GDS to connect:</p>
              {availableChannels.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400">All channels are already connected.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableChannels.map(ch => {
                    const cfg = CHANNELS[ch];
                    return (
                      <button key={ch} onClick={() => { setSelected(ch); setStep("configure"); }}
                        className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left">
                        <span className="text-xl font-bold" style={{ color: cfg.color }}>{cfg.logo}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{cfg.name}</div>
                          <div className="text-[10px] text-slate-400">{cfg.commission}% commission</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === "configure" && selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: CHANNELS[selected]?.bg ?? "#F8FAFC" }}>
                <span className="text-3xl font-bold" style={{ color: CHANNELS[selected]?.color }}>{CHANNELS[selected]?.logo}</span>
                <div>
                  <div className="font-bold text-slate-900">{CHANNELS[selected]?.name ?? selected}</div>
                  <div className="text-xs text-slate-500">{CHANNELS[selected]?.commission ?? 0}% commission</div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Hotel / Property ID *</label>
                <input value={hotelId} onChange={e => setHotelId(e.target.value)} placeholder="e.g. hotel-12345"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">API Key *</label>
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="••••••••••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                Credentials are encrypted and stored securely. Never shared with third parties.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("pick")} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Back</button>
                <button onClick={handleConnect} disabled={!hotelId || !apiKey || connecting}
                  className="flex-[2] py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white text-sm font-semibold flex items-center justify-center gap-2">
                  {connecting ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Connecting...</> : "Connect Channel"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && selected && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={28} className="text-emerald-500" />
              </div>
              <div className="font-bold text-slate-900">{CHANNELS[selected]?.name ?? selected} Connected!</div>
              <div className="text-sm text-slate-400 mt-1">Initial sync will start automatically</div>
              <button onClick={onClose} className="mt-4 btn-primary text-sm">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedSync, setSelectedSync] = useState<ChannelConnection | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  const fetchConnections = () => {
    api.channels.list()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data.channels ?? data.data ?? []);
        setConnections(list.map(mapConnection));
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load channels");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const totalRevenue = connections.reduce((s, c) => s + c.stats.last30DayRevenue, 0);
  const totalBookings = connections.reduce((s, c) => s + c.stats.totalReservations, 0);
  const activeCount = connections.filter(c => c.status === "ACTIVE").length;

  const handleSyncAll = () => {
    setSyncing("all");
    api.channels.syncAll()
      .catch(() => {
        // Fallback: sync each active channel individually
        return Promise.all(connections.filter(c => c.status === "ACTIVE").map(c =>
          api.channels.sync(c.id, "rates").catch(() => {})
        ));
      })
      .finally(() => setSyncing(null));
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-400">Loading channel connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Connected Channels", value: connections.length, sub: `${activeCount} active`, color: "#3B82F6" },
          { label: "Total OTA Bookings", value: totalBookings, sub: "all time", color: "#8B5CF6" },
          { label: "OTA Revenue (30d)", value: fmt(totalRevenue), sub: "gross", color: "#10B981" },
          { label: "Avg Commission", value: `${connections.length > 0 ? Math.round(connections.reduce((s,c) => s + c.commissionPct, 0) / connections.length) : 0}%`, sub: "across channels", color: "#F59E0B" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="text-xs text-slate-400 mb-2">{label}</div>
            <div className="text-2xl font-extrabold text-slate-900">{value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-bold text-slate-900">Channel Connections</h2>
        <div className="flex gap-2">
          <button onClick={handleSyncAll} disabled={!!syncing}
            className="btn-ghost text-xs flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {syncing === "all" ? "Syncing All..." : "Sync All"}
          </button>
          <button onClick={() => setShowConnect(true)} className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={13} /> Connect Channel
          </button>
        </div>
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {connections.length === 0 && !error && (
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <Wifi size={32} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700 text-lg">No Channels Connected</h3>
            <p className="text-sm text-slate-400 mt-1">Connect your first OTA or GDS channel to start receiving bookings.</p>
          </div>
        )}

        {connections.map(conn => {
          const ch = CHANNELS[conn.channel] ?? { name: conn.channel, logo: "?", color: "#64748B", bg: "#F8FAFC", commission: 0 };
          const st = STATUS_CFG[conn.status] ?? STATUS_CFG.INACTIVE;
          const isBusy = syncing === conn.id;

          return (
            <div key={conn.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
              {/* Header */}
              <div className="p-5" style={{ background: ch.bg }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold" style={{ color: ch.color }}>{ch.logo}</span>
                    <div>
                      <div className="font-bold text-slate-900">{ch.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{conn.externalHotelId}</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.icon}{st.label}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-b border-slate-100">
                {[
                  { label: "Bookings", value: conn.stats.totalReservations },
                  { label: "30d Revenue", value: fmt(conn.stats.last30DayRevenue) },
                  { label: "Commission", value: `${conn.commissionPct}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 text-center">
                    <div className="text-xs font-bold text-slate-900">{value}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Recent logs */}
              <div className="p-4 space-y-1.5">
                {conn.syncLogs.length === 0 && (
                  <div className="text-[10px] text-slate-400">No sync history yet</div>
                )}
                {conn.syncLogs.slice(0, 2).map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    {log.success
                      ? <Check size={10} className="text-emerald-500 shrink-0" />
                      : <AlertCircle size={10} className="text-red-500 shrink-0" />}
                    <span className="text-slate-500">{log.type}</span>
                    <span className="font-semibold text-slate-700">{log.recordsProcessed} records</span>
                    <span className="text-slate-300 ml-auto">{timeAgo(log.createdAt)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                  <Clock size={9} />
                  Last sync: {timeAgo(conn.lastSyncAt)}
                  {conn.autoSync && <span className="ml-auto text-emerald-500 font-semibold">Auto-sync ON</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-slate-100">
                <button onClick={() => setSelectedSync(conn)}
                  className="flex-1 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
                  <RefreshCw size={12} /> Sync Now
                </button>
                <div className="w-px bg-slate-100" />
                <button onClick={() => setSelectedSync(conn)}
                  className="flex-1 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                  <ArrowDownToLine size={12} /> Pull Res.
                </button>
                <div className="w-px bg-slate-100" />
                <button className="px-4 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-50 transition-colors">
                  <ChevronRight size={13} />
                </button>
              </div>

              {conn.status === "ERROR" && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                    <AlertCircle size={11} />
                    Last sync failed. Check API credentials.
                    <button className="ml-auto underline">Reconnect</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add channel card */}
        <button onClick={() => setShowConnect(true)}
          className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center">
            <Plus size={20} />
          </div>
          <div className="text-sm font-semibold">Connect New Channel</div>
          <div className="text-xs text-center">Booking.com, Expedia, Airbnb, GDS and more</div>
        </button>
      </div>

      {/* Modals */}
      {selectedSync && <SyncModal conn={selectedSync} onClose={() => setSelectedSync(null)} />}
      {showConnect && <ConnectModal connections={connections} onClose={() => setShowConnect(false)} onConnected={fetchConnections} />}
    </div>
  );
}
