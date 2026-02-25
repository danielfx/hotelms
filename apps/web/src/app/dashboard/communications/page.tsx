"use client";
import { useState } from "react";
import { Send, Mail, MessageSquare, Phone, Search, Check, CheckCheck, AlertCircle, Plus, Filter, Zap, Inbox } from "lucide-react";

type Channel = "EMAIL" | "SMS" | "WHATSAPP" | "PORTAL";
type MsgStatus = "DELIVERED" | "FAILED" | "SCHEDULED" | "SENDING";

interface Conversation {
  id: string; guestName: string; confirmationNo: string; roomNo: string;
  lastMessage: string; lastTime: string; channel: Channel;
  unread: number; status: MsgStatus;
}

interface Message {
  id: string; direction: "INBOUND" | "OUTBOUND"; content: string;
  time: string; status: MsgStatus; channel: Channel;
}

const CHANNEL_CFG: Record<Channel, { icon: any; color: string; bg: string; label: string }> = {
  EMAIL:    { icon: <Mail size={13} />,          color: "#3B82F6", bg: "#EFF6FF", label: "Email" },
  SMS:      { icon: <Phone size={13} />,         color: "#10B981", bg: "#ECFDF5", label: "SMS" },
  WHATSAPP: { icon: <MessageSquare size={13} />, color: "#25D366", bg: "#F0FDF4", label: "WhatsApp" },
  PORTAL:   { icon: <MessageSquare size={13} />, color: "#8B5CF6", bg: "#F5F3FF", label: "Portal" },
};

const TEMPLATES = [
  { type: "BOOKING_CONFIRMATION", label: "Booking Confirmation", channels: ["EMAIL"], icon: "✅" },
  { type: "PRE_ARRIVAL",          label: "Pre-Arrival",          channels: ["EMAIL","WHATSAPP"], icon: "🗓" },
  { type: "CHECK_IN_WELCOME",     label: "Check-in Welcome",     channels: ["SMS","WHATSAPP"], icon: "🏨" },
  { type: "CHECK_OUT_RECEIPT",    label: "Checkout Receipt",     channels: ["EMAIL"], icon: "🧾" },
  { type: "REVIEW_REQUEST",       label: "Review Request",       channels: ["EMAIL"], icon: "⭐" },
];

export default function CommunicationsPage() {
  const [conversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [replyChannel, setReplyChannel] = useState<Channel>("WHATSAPP");
  const [activeTab, setActiveTab] = useState<"inbox" | "templates" | "bulk">("inbox");
  const [search, setSearch] = useState("");

  const sendReply = () => {
    if (!reply.trim() || !selectedConv) return;
    setMessages(m => [...m, {
      id: String(Date.now()), direction: "OUTBOUND", content: reply,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      status: "SENDING", channel: replyChannel,
    }]);
    setReply("");
    setTimeout(() => setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, status: "DELIVERED" } : msg)), 1000);
  };

  const filteredConvs = conversations.filter(c =>
    !search || c.guestName.toLowerCase().includes(search.toLowerCase()) || c.confirmationNo.includes(search)
  );

  const stats = [
    { label: "Sent Today",     value: "0",    sub: "No messages yet", color: "#3B82F6" },
    { label: "Delivery Rate",  value: "--",   sub: "No data",         color: "#10B981" },
    { label: "Unread",         value: "0",    sub: "All caught up",   color: "#F59E0B" },
    { label: "Scheduled",      value: "0",    sub: "None scheduled",  color: "#8B5CF6" },
  ];

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
        {(["inbox", "templates", "bulk"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "inbox" ? "📬 Inbox" : t === "templates" ? "📝 Templates" : "📢 Bulk Send"}
          </button>
        ))}
      </div>

      {/* INBOX */}
      {activeTab === "inbox" && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex" style={{ height: 540 }}>
          {/* Conversations list */}
          <div className="w-80 border-r border-slate-100 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Inbox size={36} className="text-slate-300 mb-3" />
                  <div className="text-sm font-semibold text-slate-400">No conversations yet</div>
                  <div className="text-xs text-slate-400 mt-1">Guest messages will appear here once the communications module is connected.</div>
                </div>
              ) : (
                filteredConvs.map(conv => {
                  const ch = CHANNEL_CFG[conv.channel];
                  const isSelected = selectedConv?.id === conv.id;
                  return (
                    <button key={conv.id} onClick={() => setSelectedConv(conv)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50/60 border-r-2 border-blue-500" : ""}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {conv.guestName.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{conv.guestName}</div>
                            <div className="text-[10px] text-slate-400">{conv.confirmationNo} {conv.roomNo !== "—" ? `· Rm ${conv.roomNo}` : ""}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] text-slate-400">{conv.lastTime}</span>
                          {conv.unread > 0 && (
                            <span className="w-4 h-4 bg-blue-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{conv.unread}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-md" style={{ background: ch.bg, color: ch.color }}>{ch.icon}</span>
                        <span className="text-[11px] text-slate-500 truncate">{conv.lastMessage}</span>
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
                    <div className="font-bold text-slate-900 text-sm">{selectedConv.guestName}</div>
                    <div className="text-[10px] text-slate-400">{selectedConv.confirmationNo} {selectedConv.roomNo !== "—" ? `· Room ${selectedConv.roomNo}` : ""}</div>
                  </div>
                  <div className="flex gap-2">
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
                  {messages.map(msg => {
                    const ch = CHANNEL_CFG[msg.channel];
                    return (
                      <div key={msg.id} className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.direction === "OUTBOUND" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
                          <div className="text-sm">{msg.content}</div>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] ${msg.direction === "OUTBOUND" ? "text-blue-200 justify-end" : "text-slate-400"}`}>
                            {msg.time}
                            {msg.direction === "OUTBOUND" && (
                              msg.status === "DELIVERED" ? <CheckCheck size={10} /> : <Check size={10} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply */}
                <div className="border-t border-slate-100 p-4">
                  <div className="flex gap-2">
                    <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                      placeholder={`Reply via ${CHANNEL_CFG[replyChannel].label}…`}
                      className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                    <button onClick={sendReply} disabled={!reply.trim()}
                      className="w-10 h-10 self-end bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 rounded-2xl flex items-center justify-center transition-colors">
                      <Send size={15} className="text-white" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {TEMPLATES.slice(0, 3).map(t => (
                      <button key={t.type} onClick={() => setReply(`[${t.label} template]`)}
                        className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-semibold flex items-center gap-1 transition-colors">
                        <Zap size={9} /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare size={48} className="text-slate-200 mb-4" />
                <div className="text-lg font-semibold text-slate-400">Coming Soon</div>
                <div className="text-sm text-slate-400 mt-2 max-w-sm">
                  The guest communications module is being set up. Once connected, you will be able to message guests via Email, SMS, WhatsApp, and the guest portal.
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
            <h3 className="font-bold text-slate-900">Message Templates</h3>
            <button className="btn-primary text-xs flex items-center gap-1"><Plus size={12} /> New Template</button>
          </div>
          <div className="divide-y divide-slate-50">
            {TEMPLATES.map(t => (
              <div key={t.type} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                  <div className="flex gap-1.5 mt-1">
                    {t.channels.map(ch => {
                      const cfg = CHANNEL_CFG[ch as Channel];
                      return (
                        <span key={ch} className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-blue-600 hover:underline font-semibold">Edit</button>
                  <button className="text-xs text-slate-400 hover:underline">Preview</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BULK SEND */}
      {activeTab === "bulk" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 max-w-2xl">
          <h3 className="font-bold text-slate-900">Send Bulk Message</h3>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Audience</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option>All guests</option>
              <option>VIP guests only</option>
              <option>Guests checking in today</option>
              <option>Guests checked out last 7 days</option>
              <option>Opted-in marketing list</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Channel</label>
            <div className="flex gap-2">
              {(["EMAIL","SMS","WHATSAPP"] as Channel[]).map(ch => {
                const cfg = CHANNEL_CFG[ch];
                return (
                  <button key={ch} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-700 transition-all">
                    <span style={{ color: cfg.color }}>{cfg.icon}</span> {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Subject (Email)</label>
            <input placeholder="e.g. Exclusive summer offer for our valued guests"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Message</label>
            <textarea rows={4} placeholder="Write your message here… Use {{firstName}}, {{confirmationNo}} for personalization."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Schedule (optional)</label>
            <input type="datetime-local"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Preview</button>
            <button className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2">
              <Send size={14} /> Send Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
