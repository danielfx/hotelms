"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Send, Mail, MessageSquare, Phone, Search, Check, CheckCheck, Plus, Zap, Inbox, Loader2, X } from "lucide-react";
import api from "@/lib/api";

type Channel = "EMAIL" | "SMS" | "WHATSAPP" | "PORTAL";

interface Conversation {
  reservationId: string;
  guest: { firstName: string; lastName: string; email: string };
  confirmationNo: string;
  messages: any[];
  lastMessage: any;
  unreadCount: number;
}

interface Message {
  id: string; direction: "INBOUND" | "OUTBOUND"; body: string;
  sentAt: string; channel: Channel; isRead: boolean;
}

const fmtTime = (d: string) => {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = diffMs / 3600000;
  if (diffH < 24) return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffH < 48) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* ─── Template Create/Edit Modal ──────────────────────────────────────────── */

function TemplateModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("communications");
  const tc = useTranslations("common");
  const [name, setName] = useState(editing?.name || editing?.label || "");
  const [subject, setSubject] = useState(editing?.subject || "");
  const [body, setBody] = useState(editing?.body || "");
  const [channel, setChannel] = useState<Channel>(editing?.channel || "EMAIL");
  const [saving, setSaving] = useState(false);

  const CHANNEL_CFG: Record<Channel, { icon: any; color: string; bg: string; label: string }> = {
    EMAIL:    { icon: <Mail size={13} />,          color: "#3B82F6", bg: "#EFF6FF", label: t("emailChannel") },
    SMS:      { icon: <Phone size={13} />,         color: "#10B981", bg: "#ECFDF5", label: t("sms") },
    WHATSAPP: { icon: <MessageSquare size={13} />, color: "#25D366", bg: "#F0FDF4", label: t("whatsapp") },
    PORTAL:   { icon: <MessageSquare size={13} />, color: "#8B5CF6", bg: "#F5F3FF", label: "Portal" },
  };

  const handleSubmit = async () => {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await api.communications.createTemplate({ name, subject, body, channel });
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{editing ? tc("edit") + " " + t("templates") : t("newTemplate")}</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{tc("name")}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Welcome Email"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("subject")}</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Welcome to our hotel!"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("body")}</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
              placeholder="Write your template body here... Use {{firstName}}, {{confirmationNo}} for personalization."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("channel")}</label>
            <div className="flex gap-2">
              {(["EMAIL", "SMS", "WHATSAPP"] as Channel[]).map(ch => {
                const cfg = CHANNEL_CFG[ch];
                const isActive = channel === ch;
                return (
                  <button key={ch} onClick={() => setChannel(ch)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${isActive ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700 hover:border-blue-300"}`}>
                    <span style={{ color: cfg.color }}>{cfg.icon}</span> {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">{tc("cancel")}</button>
            <button onClick={handleSubmit} disabled={!name.trim() || !body.trim() || saving}
              className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold flex items-center justify-center gap-2 btn-primary disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? tc("saving") : editing ? tc("update") : tc("create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Template Preview Modal ──────────────────────────────────────────────── */

function PreviewModal({
  template,
  onClose,
}: {
  template: any;
  onClose: () => void;
}) {
  const t = useTranslations("communications");
  const tc = useTranslations("common");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{t("preview")}</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">{tc("name")}</label>
            <div className="text-sm font-medium text-slate-900">{template.name || template.label || template.type || "--"}</div>
          </div>
          {template.subject && (
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">{t("subject")}</label>
              <div className="text-sm text-slate-700">{template.subject}</div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">{t("body")}</label>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
              {template.body || "(No body content)"}
            </div>
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            {tc("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bulk Send Preview Modal ─────────────────────────────────────────────── */

function BulkPreviewModal({
  bulkForm,
  onClose,
}: {
  bulkForm: { audience: string; channel: string; subject: string; body: string; schedule: string };
  onClose: () => void;
}) {
  const t = useTranslations("communications");
  const tc = useTranslations("common");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{t("preview")}</h3>
          <button onClick={onClose}><X size={14} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">{t("recipients")}</label>
              <div className="text-sm font-medium text-slate-900 capitalize">{bulkForm.audience.replace(/_/g, " ")}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">{t("channel")}</label>
              <div className="text-sm font-medium text-slate-900">{bulkForm.channel}</div>
            </div>
          </div>
          {bulkForm.subject && (
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">{t("subject")}</label>
              <div className="text-sm text-slate-700">{bulkForm.subject}</div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">{t("body")}</label>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
              {bulkForm.body || "(No message content)"}
            </div>
          </div>
          {bulkForm.schedule && (
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">{t("schedule")}</label>
              <div className="text-sm text-slate-700">{new Date(bulkForm.schedule).toLocaleString()}</div>
            </div>
          )}
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            {tc("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function CommunicationsPage() {
  const t = useTranslations("communications");
  const tc = useTranslations("common");

  const CHANNEL_CFG: Record<Channel, { icon: any; color: string; bg: string; label: string }> = {
    EMAIL:    { icon: <Mail size={13} />,          color: "#3B82F6", bg: "#EFF6FF", label: t("emailChannel") },
    SMS:      { icon: <Phone size={13} />,         color: "#10B981", bg: "#ECFDF5", label: t("sms") },
    WHATSAPP: { icon: <MessageSquare size={13} />, color: "#25D366", bg: "#F0FDF4", label: t("whatsapp") },
    PORTAL:   { icon: <MessageSquare size={13} />, color: "#8B5CF6", bg: "#F5F3FF", label: "Portal" },
  };

  const TEMPLATE_META: Record<string, { label: string; channels: string[]; icon: string }> = {
    BOOKING_CONFIRMATION: { label: "Booking Confirmation", channels: ["EMAIL"], icon: "\u2705" },
    PRE_ARRIVAL:          { label: "Pre-Arrival",          channels: ["EMAIL","WHATSAPP"], icon: "\uD83D\uDDD3" },
    CHECK_IN_WELCOME:     { label: "Check-in Welcome",     channels: ["SMS","WHATSAPP"], icon: "\uD83C\uDFE8" },
    CHECK_OUT_RECEIPT:     { label: "Checkout Receipt",     channels: ["EMAIL"], icon: "\uD83E\uDDFE" },
    REVIEW_REQUEST:        { label: "Review Request",       channels: ["EMAIL"], icon: "\u2B50" },
    CANCELLATION:          { label: "Cancellation",         channels: ["EMAIL"], icon: "\u274C" },
    PAYMENT_RECEIPT:       { label: "Payment Receipt",      channels: ["EMAIL"], icon: "\uD83D\uDCB3" },
    PROMO:                 { label: "Promotion",            channels: ["EMAIL","SMS"], icon: "\uD83C\uDF89" },
    CUSTOM:                { label: "Custom",               channels: ["EMAIL","SMS","WHATSAPP"], icon: "\u270F\uFE0F" },
  };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [replyChannel, setReplyChannel] = useState<Channel>("EMAIL");
  const [activeTab, setActiveTab] = useState<"inbox" | "templates" | "bulk">("inbox");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [commStats, setCommStats] = useState<any>(null);
  const [bulkForm, setBulkForm] = useState({ audience: "all", channel: "EMAIL" as Channel, subject: "", body: "", schedule: "" });
  const [sending, setSending] = useState(false);

  // FIX 1 & 2: Template modal state
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // FIX 3: Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // FIX 5: Bulk preview modal state
  const [showBulkPreview, setShowBulkPreview] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [inboxRes, statsRes, templatesRes] = await Promise.allSettled([
        api.communications.inbox(),
        api.communications.stats(),
        api.communications.templates(),
      ]);
      if (inboxRes.status === "fulfilled") {
        const data = Array.isArray(inboxRes.value) ? inboxRes.value : [];
        setConversations(data);
      }
      if (statsRes.status === "fulfilled" && statsRes.value) setCommStats(statsRes.value);
      if (templatesRes.status === "fulfilled") setTemplates(Array.isArray(templatesRes.value) ? templatesRes.value : []);
    } catch (err) {
      console.error("Failed to load communications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    const msgs: Message[] = (conv.messages || []).map((m: any) => ({
      id: m.id,
      direction: m.direction,
      body: m.body || m.subject || "",
      sentAt: m.sentAt || m.createdAt,
      channel: m.channel || "EMAIL",
      isRead: m.isRead,
    }));
    setMessages(msgs);
    if (msgs.length > 0) {
      setReplyChannel(msgs[msgs.length - 1].channel);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv) return;
    const optimisticMsg: Message = {
      id: String(Date.now()), direction: "OUTBOUND", body: reply,
      sentAt: new Date().toISOString(), channel: replyChannel, isRead: true,
    };
    setMessages(m => [...m, optimisticMsg]);
    const text = reply;
    setReply("");
    try {
      await api.communications.reply(selectedConv.reservationId, {
        channel: replyChannel, body: text,
      });
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  const sendBulk = async () => {
    setSending(true);
    try {
      await api.communications.bulk({
        channel: bulkForm.channel,
        subject: bulkForm.subject,
        body: bulkForm.body,
        audience: bulkForm.audience,
        scheduledAt: bulkForm.schedule || undefined,
      });
      setBulkForm({ audience: "all", channel: "EMAIL", subject: "", body: "", schedule: "" });
    } catch (err) {
      console.error("Failed to send bulk:", err);
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(c => {
    const name = `${c.guest?.firstName ?? ""} ${c.guest?.lastName ?? ""}`.toLowerCase();
    const conf = c.confirmationNo?.toLowerCase() ?? "";
    const q = search.toLowerCase();
    return !search || name.includes(q) || conf.includes(q);
  });

  const stats = [
    { label: "Total Messages", value: String(commStats?.total ?? 0), sub: commStats?.total ? "across all channels" : "No messages yet", color: "#3B82F6" },
    { label: "Delivery Rate",  value: commStats?.deliveryRate ? `${commStats.deliveryRate}%` : "--", sub: commStats?.delivered ? `${commStats.delivered} delivered` : "No data", color: "#10B981" },
    { label: "Unread",         value: String(commStats?.unread ?? 0), sub: (commStats?.unread ?? 0) === 0 ? "All caught up" : "messages pending", color: "#F59E0B" },
    { label: "By Channel",     value: String(commStats?.byChannel?.length ?? 0), sub: (commStats?.byChannel || []).map((c: any) => `${c.channel}: ${c._count}`).join(", ") || "None yet", color: "#8B5CF6" },
  ];

  const displayTemplates = templates.length > 0
    ? templates.map((tpl: any) => {
        const meta = TEMPLATE_META[tpl.type] || { label: tpl.type, channels: [tpl.channel || "EMAIL"], icon: "\uD83D\uDCC4" };
        return { ...tpl, ...meta };
      })
    : Object.entries(TEMPLATE_META).map(([type, meta]) => ({ type, ...meta }));

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-16 flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="text-xs text-slate-400 mb-1">{label}</div>
            <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(["inbox", "templates", "bulk"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
            {tab === "inbox" ? t("inbox") : tab === "templates" ? t("templates") : t("bulkSend")}
          </button>
        ))}
      </div>

      {/* INBOX */}
      {activeTab === "inbox" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row" style={{ height: 540 }}>
          {/* Conversations list */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchMessages")}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Inbox size={36} className="text-slate-300 mb-3" />
                  <div className="text-sm font-semibold text-slate-400">{t("noMessages")}</div>
                  <div className="text-xs text-slate-400 mt-1">Guest messages will appear here when guests communicate via Email, SMS, or WhatsApp.</div>
                </div>
              ) : (
                filteredConvs.map(conv => {
                  const lastCh = (conv.lastMessage?.channel || "EMAIL") as Channel;
                  const ch = CHANNEL_CFG[lastCh] || CHANNEL_CFG.EMAIL;
                  const isSelected = selectedConv?.reservationId === conv.reservationId;
                  const guestName = `${conv.guest?.firstName ?? ""} ${conv.guest?.lastName ?? ""}`.trim();
                  const lastBody = conv.lastMessage?.body || conv.lastMessage?.subject || "";
                  const lastTime = fmtTime(conv.lastMessage?.sentAt || conv.lastMessage?.createdAt || "");
                  return (
                    <button key={conv.reservationId} onClick={() => selectConversation(conv)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50/60 border-r-2 border-blue-500" : ""}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {(conv.guest?.firstName?.[0] ?? "") + (conv.guest?.lastName?.[0] ?? "")}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{guestName || tc("guest")}</div>
                            <div className="text-[10px] text-slate-400">{conv.confirmationNo}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] text-slate-400">{lastTime}</span>
                          {conv.unreadCount > 0 && (
                            <span className="w-4 h-4 bg-blue-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-md" style={{ background: ch.bg, color: ch.color }}>{ch.icon}</span>
                        <span className="text-[11px] text-slate-500 truncate">{lastBody}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat thread */}
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {/* Thread header */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {selectedConv.guest?.firstName} {selectedConv.guest?.lastName}
                    </div>
                    <div className="text-[10px] text-slate-400">{selectedConv.confirmationNo}</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(CHANNEL_CFG).map(([k, v]) => (
                      <button key={k} onClick={() => setReplyChannel(k as Channel)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${replyChannel === k ? "shadow-sm" : "opacity-40 hover:opacity-70"}`}
                        style={{ background: v.bg, color: v.color }}>
                        {v.icon} {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">{t("noMessages")}</div>
                  ) : messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.direction === "OUTBOUND" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
                        <div className="text-sm">{msg.body}</div>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] ${msg.direction === "OUTBOUND" ? "text-blue-200 justify-end" : "text-slate-400"}`}>
                          {fmtTime(msg.sentAt)}
                          {msg.direction === "OUTBOUND" && <CheckCheck size={10} />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="border-t border-slate-100 p-4">
                  <div className="flex gap-2">
                    <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                      placeholder={`Reply via ${CHANNEL_CFG[replyChannel].label}...`}
                      className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                    <button onClick={sendReply} disabled={!reply.trim()}
                      className="w-10 h-10 self-end bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 rounded-2xl flex items-center justify-center transition-colors">
                      <Send size={15} className="text-white" />
                    </button>
                  </div>
                  {/* FIX 4: Quick-template buttons - insert actual template body */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {Object.entries(TEMPLATE_META).slice(0, 3).map(([type, meta]) => (
                      <button key={type} onClick={() => {
                        const tpl = templates.find(tItem => tItem.name?.toLowerCase().includes(meta.label.toLowerCase()) || tItem.type === type);
                        setReply(tpl?.body || `[${meta.label} template - not found]`);
                      }}
                        className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-semibold flex items-center gap-1 transition-colors">
                        <Zap size={9} /> {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare size={48} className="text-slate-200 mb-4" />
                <div className="text-lg font-semibold text-slate-400">{t("inbox")}</div>
                <div className="text-sm text-slate-400 mt-2 max-w-sm">
                  Choose a guest conversation from the left to view messages and reply via Email, SMS, WhatsApp, or the guest portal.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEMPLATES */}
      {activeTab === "templates" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">{t("templates")}</h3>
            {/* FIX 1: New Template button with onClick */}
            <button
              onClick={() => { setEditingTemplate(null); setShowNewTemplate(true); }}
              className="btn-primary text-xs flex items-center gap-1"><Plus size={12} /> {t("newTemplate")}</button>
          </div>
          <div className="divide-y divide-slate-50">
            {displayTemplates.map((tpl: any) => {
              const meta = TEMPLATE_META[tpl.type] || { label: tpl.type, channels: [tpl.channel || "EMAIL"], icon: "\uD83D\uDCC4" };
              return (
                <div key={tpl.type || tpl.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{meta.label}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {(meta.channels || []).map((ch: string) => {
                        const cfg = CHANNEL_CFG[ch as Channel];
                        if (!cfg) return null;
                        return (
                          <span key={ch} className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {tpl.isActive !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tpl.isActive ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                        {tpl.isActive ? tc("active") : tc("inactive")}
                      </span>
                    )}
                    {/* FIX 2: Edit button with onClick */}
                    <button
                      onClick={() => { setEditingTemplate(tpl); setShowNewTemplate(true); }}
                      className="text-xs text-blue-600 hover:underline font-semibold">{tc("edit")}</button>
                    {/* FIX 3: Preview button with onClick */}
                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="text-xs text-slate-400 hover:underline">{t("preview")}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BULK SEND */}
      {activeTab === "bulk" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 max-w-2xl">
          <h3 className="font-bold text-slate-900">{t("sendBulk")}</h3>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("recipients")}</label>
            <select value={bulkForm.audience} onChange={e => setBulkForm(f => ({ ...f, audience: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="all">All guests</option>
              <option value="vip">VIP guests only</option>
              <option value="checking_in_today">Guests checking in today</option>
              <option value="checked_out_7d">Guests checked out last 7 days</option>
              <option value="marketing">Opted-in marketing list</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("channel")}</label>
            <div className="flex gap-2 flex-wrap">
              {(["EMAIL","SMS","WHATSAPP"] as Channel[]).map(ch => {
                const cfg = CHANNEL_CFG[ch];
                const isActive = bulkForm.channel === ch;
                return (
                  <button key={ch} onClick={() => setBulkForm(f => ({ ...f, channel: ch }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${isActive ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700 hover:border-blue-300"}`}>
                    <span style={{ color: cfg.color }}>{cfg.icon}</span> {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("subject")}</label>
            <input value={bulkForm.subject} onChange={e => setBulkForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Exclusive summer offer for our valued guests"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("body")}</label>
            <textarea value={bulkForm.body} onChange={e => setBulkForm(f => ({ ...f, body: e.target.value }))}
              rows={4} placeholder="Write your message here... Use {{firstName}}, {{confirmationNo}} for personalization."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">{t("schedule")}</label>
            <input type="datetime-local" value={bulkForm.schedule} onChange={e => setBulkForm(f => ({ ...f, schedule: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div className="flex gap-3">
            {/* FIX 5: Bulk Preview button with onClick */}
            <button onClick={() => setShowBulkPreview(true)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">{t("preview")}</button>
            <button onClick={sendBulk} disabled={!bulkForm.body.trim() || sending}
              className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold flex items-center justify-center gap-2">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? tc("saving") : t("sendNow")}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewTemplate && (
        <TemplateModal
          editing={editingTemplate}
          onClose={() => { setShowNewTemplate(false); setEditingTemplate(null); }}
          onSaved={loadData}
        />
      )}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
      {showBulkPreview && (
        <BulkPreviewModal
          bulkForm={bulkForm}
          onClose={() => setShowBulkPreview(false)}
        />
      )}
    </div>
  );
}
