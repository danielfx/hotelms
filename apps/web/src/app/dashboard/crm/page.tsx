"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { Users, Mail, Target, TrendingUp, Plus, Send, Eye, MousePointer, BarChart3, Filter, Loader2, X } from "lucide-react";

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

/* --- Segment Modal -------------------------------------------------------- */

function SegmentModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Segment | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("crm");
  const tc = useTranslations("common");
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.criteria || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing?.id) {
        await api.crm.updateSegment(editing.id, { name, description });
      } else {
        await api.crm.createSegment({ name, description, rules: [] });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to save segment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{editing ? t("editSegment") : t("newSegment")}</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("name")}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VIP Guests"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("descriptionCriteria")}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Describe who belongs in this segment..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">{tc("cancel")}</button>
            <button onClick={handleSubmit} disabled={!name.trim() || saving}
              className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold flex items-center justify-center gap-2 btn-primary disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? tc("saving") : editing ? t("updateSegment") : t("createSegment")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Campaign Modal ------------------------------------------------------- */

function CampaignModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Campaign | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("crm");
  const tc = useTranslations("common");
  const [name, setName] = useState(editing?.name || "");
  const [subject, setSubject] = useState(editing?.name || "");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    try {
      if (editing?.id) {
        await api.crm.updateCampaign(editing.id, { name, subject, body });
      } else {
        await api.crm.createCampaign({ name, subject, body });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{editing ? t("editCampaign") : t("newCampaign")}</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("campaignName")}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Promotion"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Exclusive summer offer!"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
              placeholder="Write your campaign email body here..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">{tc("cancel")}</button>
            <button onClick={handleSubmit} disabled={!name.trim() || !body.trim() || saving}
              className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold flex items-center justify-center gap-2 btn-primary disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? tc("saving") : editing ? t("updateCampaign") : t("createCampaign")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Analytics Modal ------------------------------------------------------ */

function AnalyticsModal({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  const t = useTranslations("crm");
  const tc = useTranslations("common");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.crm.campaignAnalytics(campaign.id)
      .then((data: any) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [campaign.id]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{t("campaignAnalytics")}</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <span className="ml-2 text-sm text-slate-500">{tc("loading")}</span>
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">{campaign.name}</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t("sent"), value: analytics.sent ?? campaign.sent ?? 0 },
                  { label: t("opened"), value: analytics.opened ?? campaign.opened ?? 0 },
                  { label: t("analytics"), value: analytics.clicked ?? campaign.clicked ?? 0 },
                  { label: t("bounced"), value: analytics.bounced ?? 0 },
                  { label: t("openRate"), value: `${analytics.openRate ?? campaign.openRate ?? 0}%` },
                  { label: t("clickRate"), value: `${analytics.clickRate ?? campaign.clickRate ?? 0}%` },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-slate-900">{item.value}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-sm text-slate-400">{t("noAnalytics")}</div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { label: t("sent"), value: campaign.sent },
                  { label: t("opened"), value: campaign.opened },
                  { label: t("openRate"), value: `${campaign.openRate}%` },
                  { label: t("clickRate"), value: `${campaign.clickRate}%` },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-slate-900">{item.value}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            {tc("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Main Page ------------------------------------------------------------ */

export default function CRMPage() {
  const t = useTranslations("crm");
  const tc = useTranslations("common");
  const [tab, setTab] = useState<"segments" | "campaigns">("segments");
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // FIX 1: Modal states
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // FIX 3: Analytics modal state
  const [analyticsCampaign, setAnalyticsCampaign] = useState<Campaign | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [segData, campData] = await Promise.all([
        api.crm.listSegments().catch(() => []),
        api.crm.listCampaigns().catch(() => []),
      ]);

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
          const sent = Number(c.totalSent ?? c.sent ?? c.sentCount ?? 0);
          const opened = Number(c.totalOpened ?? c.opened ?? c.openedCount ?? 0);
          const clicked = Number(c.totalClicked ?? c.clicked ?? c.clickedCount ?? 0);
          return {
            id: c.id ?? c._id ?? "",
            name: c.name ?? c.subject ?? "Unnamed Campaign",
            segment: c.segment?.name ?? c.segment ?? c.segmentName ?? c.audience ?? "--",
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendCampaign = async (campaign: Campaign) => {
    if (!confirm(`Are you sure you want to send the campaign "${campaign.name}"? This action cannot be undone.`)) return;
    try {
      await api.crm.sendCampaign(campaign.id);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to send campaign");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="ml-3 text-slate-500 text-sm">{t("loadingCRM")}</span>
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
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
        {/* FIX 1: New Segment / New Campaign button with onClick */}
        <button
          onClick={() => {
            if (tab === "segments") {
              setEditingSegment(null);
              setShowSegmentModal(true);
            } else {
              setEditingCampaign(null);
              setShowCampaignModal(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> {tab === "segments" ? t("newSegment") : t("newCampaign")}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("totalSegments"), value: segments.length, icon: Target, color: "bg-purple-50 text-purple-600" },
          { label: t("totalGuests"), value: segments.reduce((sum, s) => sum + s.guestCount, 0), icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: t("campaignsCount"), value: campaigns.length, icon: Mail, color: "bg-green-50 text-green-600" },
          { label: t("avgOpenRate"), value: `${avgOpenRate}%`, icon: Eye, color: "bg-amber-50 text-amber-600" },
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
        {(["segments", "campaigns"] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === tb ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {tb === "segments" ? t("segments") : t("campaigns")}
          </button>
        ))}
      </div>

      {tab === "segments" && (
        <div className="bg-white rounded-xl border border-slate-200">
          {segments.length === 0 ? (
            <div className="text-center py-16">
              <Target size={36} className="mx-auto text-slate-300 mb-3" />
              <div className="text-sm font-semibold text-slate-400">{t("noSegments")}</div>
              <div className="text-xs text-slate-400 mt-1">{t("noSegmentsDesc")}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                    <th className="p-4 font-medium">{t("segmentName")}</th>
                    <th className="p-4 font-medium text-center">{t("guestsCount")}</th>
                    <th className="p-4 font-medium">{t("criteria")}</th>
                    <th className="p-4 font-medium">{t("lastUpdated")}</th>
                    <th className="p-4 font-medium text-right">{tc("actions")}</th>
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
                        {/* FIX 2: Segment Edit button with onClick */}
                        <button
                          onClick={() => { setEditingSegment(seg); setShowSegmentModal(true); }}
                          className="text-blue-600 text-sm hover:underline">{tc("edit")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
              <Mail size={36} className="mx-auto text-slate-300 mb-3" />
              <div className="text-sm font-semibold text-slate-400">{t("noCampaigns")}</div>
              <div className="text-xs text-slate-400 mt-1">{t("noCampaignsDesc")}</div>
            </div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <p className="text-sm text-slate-500">{t("segment")}: {c.segment}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.status === "SENT" ? "bg-green-50 text-green-700" : c.status === "DRAFT" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>
                    {c.status}
                  </span>
                </div>
                {c.status === "SENT" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900">{c.sent}</div>
                      <div className="text-xs text-slate-500">{t("sent")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900">{c.opened}</div>
                      <div className="text-xs text-slate-500">{t("opened")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{c.openRate}%</div>
                      <div className="text-xs text-slate-500">{t("openRate")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{c.clickRate}%</div>
                      <div className="text-xs text-slate-500">{t("clickRate")}</div>
                    </div>
                  </div>
                )}
                {/* FIX 3: Campaign action buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => { setEditingCampaign(c); setShowCampaignModal(true); }}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    {tc("edit")}
                  </button>
                  {c.status === "DRAFT" && (
                    <button
                      onClick={() => handleSendCampaign(c)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1">
                      <Send size={11} /> {tc("send")}
                    </button>
                  )}
                  <button
                    onClick={() => setAnalyticsCampaign(c)}
                    className="px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1">
                    <BarChart3 size={11} /> {t("analytics")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showSegmentModal && (
        <SegmentModal
          editing={editingSegment}
          onClose={() => { setShowSegmentModal(false); setEditingSegment(null); }}
          onSaved={loadData}
        />
      )}
      {showCampaignModal && (
        <CampaignModal
          editing={editingCampaign}
          onClose={() => { setShowCampaignModal(false); setEditingCampaign(null); }}
          onSaved={loadData}
        />
      )}
      {analyticsCampaign && (
        <AnalyticsModal
          campaign={analyticsCampaign}
          onClose={() => setAnalyticsCampaign(null)}
        />
      )}
    </div>
  );
}
