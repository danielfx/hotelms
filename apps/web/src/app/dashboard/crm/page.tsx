"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Users, Mail, Target, TrendingUp, Plus, Send, Eye, MousePointer, BarChart3, Filter, Loader2 } from "lucide-react";

interface Segment {
  id: string;
  name: string;
  guestCount: number;
  criteria: string;
  lastUpdated: string;
}

interface Campaign {
  id: string;
  name: string;
  segment: string;
  status: string;
  sentAt: string | null;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export default function CRMPage() {
  const [tab, setTab] = useState<"segments" | "campaigns">("segments");
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [segData, campData] = await Promise.all([
          api.crm.listSegments().catch(() => []),
          api.crm.listCampaigns().catch(() => []),
        ]);
        if (cancelled) return;

        const segArr = Array.isArray(segData) ? segData : (segData?.data ?? segData?.segments ?? segData?.items ?? []);
        if (Array.isArray(segArr)) {
          setSegments(segArr.map((s: any) => ({
            id: s.id ?? s._id ?? "",
            name: s.name ?? "Unnamed Segment",
            guestCount: Number(s.guestCount ?? s.count ?? s.guests ?? 0),
            criteria: s.criteria ?? s.description ?? s.filter ?? "--",
            lastUpdated: s.lastUpdated ?? s.updatedAt ?? s.updated_at ?? "",
          })));
        }

        const campArr = Array.isArray(campData) ? campData : (campData?.data ?? campData?.campaigns ?? campData?.items ?? []);
        if (Array.isArray(campArr)) {
          setCampaigns(campArr.map((c: any) => {
            const sent = Number(c.sent ?? c.sentCount ?? c.recipientCount ?? 0);
            const opened = Number(c.opened ?? c.openedCount ?? c.opens ?? 0);
            const clicked = Number(c.clicked ?? c.clickedCount ?? c.clicks ?? 0);
            return {
              id: c.id ?? c._id ?? "",
              name: c.name ?? c.subject ?? "Unnamed Campaign",
              segment: c.segment ?? c.segmentName ?? c.audience ?? "--",
              status: c.status ?? "DRAFT",
              sentAt: c.sentAt ?? c.sent_at ?? c.scheduledAt ?? null,
              sent,
              opened,
              clicked,
              openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
              clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
            };
          }));
        }
      } catch (err) {
        console.error("Failed to load CRM data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="ml-3 text-slate-500 text-sm">Loading CRM data...</span>
      </div>
    );
  }

  const sentCampaigns = campaigns.filter(c => c.status === "SENT");
  const avgOpenRate = sentCampaigns.length > 0
    ? Math.round(sentCampaigns.reduce((sum, c) => sum + c.openRate, 0) / sentCampaigns.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM & Marketing</h1>
          <p className="text-slate-500 text-sm mt-1">Guest segmentation and email campaigns</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> {tab === "segments" ? "New Segment" : "New Campaign"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Segments", value: segments.length, icon: Target, color: "bg-purple-50 text-purple-600" },
          { label: "Total Guests", value: segments.reduce((sum, s) => sum + s.guestCount, 0), icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Campaigns", value: campaigns.length, icon: Mail, color: "bg-green-50 text-green-600" },
          { label: "Avg Open Rate", value: `${avgOpenRate}%`, icon: Eye, color: "bg-amber-50 text-amber-600" },
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

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["segments", "campaigns"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "segments" ? "Guest Segments" : "Email Campaigns"}
          </button>
        ))}
      </div>

      {tab === "segments" && (
        <div className="bg-white rounded-xl border border-slate-200">
          {segments.length === 0 ? (
            <div className="text-center py-16">
              <Target size={36} className="mx-auto text-slate-300 mb-3" />
              <div className="text-sm font-semibold text-slate-400">No segments yet</div>
              <div className="text-xs text-slate-400 mt-1">Create your first guest segment to start targeting your marketing.</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="p-4 font-medium">Segment Name</th>
                  <th className="p-4 font-medium text-center">Guests</th>
                  <th className="p-4 font-medium">Criteria</th>
                  <th className="p-4 font-medium">Last Updated</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {segments.map(seg => (
                  <tr key={seg.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{seg.name}</td>
                    <td className="p-4 text-center"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-sm font-medium">{seg.guestCount}</span></td>
                    <td className="p-4 text-sm text-slate-600">{seg.criteria}</td>
                    <td className="p-4 text-sm text-slate-500">{seg.lastUpdated ? new Date(seg.lastUpdated).toLocaleDateString() : "--"}</td>
                    <td className="p-4 text-right">
                      <button className="text-blue-600 text-sm hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
              <Mail size={36} className="mx-auto text-slate-300 mb-3" />
              <div className="text-sm font-semibold text-slate-400">No campaigns yet</div>
              <div className="text-xs text-slate-400 mt-1">Create your first email campaign to engage your guests.</div>
            </div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <p className="text-sm text-slate-500">Segment: {c.segment}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.status === "SENT" ? "bg-green-50 text-green-700" : c.status === "DRAFT" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>
                    {c.status}
                  </span>
                </div>
                {c.status === "SENT" && (
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900">{c.sent}</div>
                      <div className="text-xs text-slate-500">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900">{c.opened}</div>
                      <div className="text-xs text-slate-500">Opened</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{c.openRate}%</div>
                      <div className="text-xs text-slate-500">Open Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{c.clickRate}%</div>
                      <div className="text-xs text-slate-500">Click Rate</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
