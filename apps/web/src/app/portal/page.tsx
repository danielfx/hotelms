"use client";
import { useState } from "react";
import { BedDouble, MessageCircle, Wrench, Receipt, Key, Star, LogIn, LogOut, Wifi, Coffee, Car, Dumbbell, CheckCircle, Clock, AlertCircle, Plus, X, ChevronRight, Send } from "lucide-react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const GUEST = { firstName: "María", lastName: "García", email: "maria@email.com" };
const PROPERTY = {
  name: "Grand Plaza Hotel & Spa", phone: "+1 (305) 555-0100",
  checkInTime: "15:00", checkOutTime: "11:00",
  amenities: ["Pool open 7am-10pm", "Gym open 24h", "Spa by appointment", "Restaurant 7am-11pm", "Room service 24h", "Valet parking available"],
};
const RESERVATION = {
  confirmationNo: "RES-1001", status: "CHECKED_IN",
  checkIn: "2025-02-23", checkOut: "2025-02-27",
  nights: 4, room: "201", roomType: "Deluxe Ocean Room",
};
const FOLIO_CHARGES = [
  { id: "1", type: "ROOM", description: "Room 201 – Deluxe (Night 1)", amount: 139, date: "02/23" },
  { id: "2", type: "ROOM", description: "Room 201 – Deluxe (Night 2)", amount: 139, date: "02/24" },
  { id: "3", type: "MINIBAR", description: "Minibar – Champagne & snacks", amount: 45, date: "02/24" },
  { id: "4", type: "RESORT_FEE", description: "Resort Fee", amount: 35, date: "02/23" },
];
const MOCK_MESSAGES = [
  { id: "1", direction: "OUTBOUND", content: "Welcome to Grand Plaza, María! Your room 201 is ready. WiFi: HotelGuest / Pass: RES1001. Enjoy your stay! 🌊", createdAt: "2025-02-23T15:35:00" },
  { id: "2", direction: "INBOUND", content: "Thank you! Can I get extra towels?", createdAt: "2025-02-23T16:00:00" },
  { id: "3", direction: "OUTBOUND", content: "Of course! We'll send them up within 15 minutes. Is there anything else you need? 🏨", createdAt: "2025-02-23T16:05:00" },
];
const SERVICE_CATEGORIES = [
  { icon: "🛏", label: "Extra Towels", type: "HOUSEKEEPING", category: "towels" },
  { icon: "🍽", label: "Room Service", type: "FB", category: "room_service" },
  { icon: "🧹", label: "Room Cleaning", type: "HOUSEKEEPING", category: "cleaning" },
  { icon: "🔧", label: "Maintenance", type: "MAINTENANCE", category: "maintenance" },
  { icon: "🚗", label: "Valet", type: "CONCIERGE", category: "valet" },
  { icon: "🛎", label: "Concierge", type: "CONCIERGE", category: "concierge" },
  { icon: "🧴", label: "Toiletries", type: "HOUSEKEEPING", category: "toiletries" },
  { icon: "❄️", label: "AC / Heating", type: "MAINTENANCE", category: "climate" },
];

const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

type Tab = "home" | "chat" | "requests" | "folio" | "info";

export default function GuestPortalPage() {
  const [tab, setTab] = useState<Tab>("home");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMsg, setNewMsg] = useState("");
  const [requests, setRequests] = useState([
    { id: "r1", category: "towels", description: "Extra towels please", status: "COMPLETED", createdAt: "2025-02-23T16:02:00", icon: "🛏" },
  ]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState<typeof SERVICE_CATEGORIES[0] | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);

  const totalCharges = FOLIO_CHARGES.reduce((s, c) => s + c.amount, 0);
  const daysLeft = Math.ceil((new Date(RESERVATION.checkOut).getTime() - Date.now()) / 86400000);

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    setMessages(m => [...m, { id: String(Date.now()), direction: "INBOUND", content: newMsg, createdAt: new Date().toISOString() }]);
    setNewMsg("");
    // Simulate staff reply
    setTimeout(() => {
      setMessages(m => [...m, { id: String(Date.now() + 1), direction: "OUTBOUND", content: "Got it! We'll take care of that right away. 😊", createdAt: new Date().toISOString() }]);
    }, 1500);
  };

  const submitRequest = () => {
    if (!selectedService) return;
    setRequests(r => [{ id: String(Date.now()), category: selectedService.category, description: requestNote || selectedService.label, status: "OPEN", createdAt: new Date().toISOString(), icon: selectedService.icon }, ...r]);
    setShowRequestModal(false); setSelectedService(null); setRequestNote("");
    // Auto-confirm after 1.5s
    setTimeout(() => setRequests(r => r.map((req, i) => i === 0 ? { ...req, status: "IN_PROGRESS" } : req)), 1500);
  };

  const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
    OPEN:        { label: "Received",    color: "#3B82F6", icon: <Clock size={10} /> },
    IN_PROGRESS: { label: "In Progress", color: "#F59E0B", icon: <Clock size={10} /> },
    COMPLETED:   { label: "Completed",   color: "#10B981", icon: <CheckCircle size={10} /> },
    CANCELLED:   { label: "Cancelled",   color: "#94A3B8", icon: <X size={10} /> },
  };

  return (
    <div className="min-h-screen bg-slate-50 max-w-sm mx-auto relative pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-5 pt-10 pb-6">
        <div className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">{PROPERTY.name}</div>
        <h1 className="text-xl font-black mb-0.5">Hello, {GUEST.firstName}! 👋</h1>
        <div className="text-blue-200 text-xs">Room {RESERVATION.room} · {RESERVATION.roomType}</div>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-blue-200">Check-in</div>
            <div className="text-sm font-bold">{fmtDate(RESERVATION.checkIn)}</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-blue-200">Check-out</div>
            <div className="text-sm font-bold">{fmtDate(RESERVATION.checkOut)}</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-blue-200">Nights left</div>
            <div className="text-sm font-bold">{daysLeft}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5">

        {/* HOME */}
        {tab === "home" && (
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: <MessageCircle size={20} />, label: "Chat", tab: "chat" as Tab, badge: 0 },
                { icon: <Wrench size={20} />, label: "Requests", tab: "requests" as Tab },
                { icon: <Receipt size={20} />, label: "Bill", tab: "folio" as Tab },
                { icon: <Key size={20} />, label: "Key", tab: "home" as Tab },
              ].map(({ icon, label, tab: t }) => (
                <button key={label} onClick={() => setTab(t)}
                  className="bg-white rounded-2xl p-3 text-center border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="text-blue-600 flex justify-center mb-1.5">{icon}</div>
                  <div className="text-[11px] font-semibold text-slate-600">{label}</div>
                </button>
              ))}
            </div>

            {/* Digital key */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-400">Digital Room Key</div>
                  <div className="text-2xl font-black">Room {RESERVATION.room}</div>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Key size={22} className="text-white" />
                </div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="font-mono font-bold text-lg tracking-widest">R201-XJKP-4821</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Tap phone on lock · Valid until {fmtDate(RESERVATION.checkOut)}</div>
              </div>
            </div>

            {/* Today's info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Today at the Hotel</div>
              <div className="space-y-2">
                {PROPERTY.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Leave a review CTA */}
            <button onClick={() => setShowReview(true)}
              className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left flex items-center gap-3">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900">Enjoying your stay?</div>
                <div className="text-xs text-slate-500">Leave a quick review</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 260px)" }}>
            <div className="text-sm font-bold text-slate-900 mb-3">Chat with Hotel Staff</div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.direction === "INBOUND" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.direction === "INBOUND" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"}`}>
                    <div>{m.content}</div>
                    <div className={`text-[10px] mt-1 ${m.direction === "INBOUND" ? "text-blue-200" : "text-slate-400"}`}>{fmtTime(m.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-3">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              <button onClick={sendMessage} disabled={!newMsg.trim()}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 rounded-2xl flex items-center justify-center transition-colors">
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* SERVICE REQUESTS */}
        {tab === "requests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Service Requests</div>
              <button onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
                <Plus size={12} /> New
              </button>
            </div>
            {requests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No requests yet</div>
            ) : (
              <div className="space-y-2">
                {requests.map(r => {
                  const sc = STATUS_CFG[r.status];
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{r.description}</div>
                        <div className="text-[10px] text-slate-400">{fmtTime(r.createdAt)}</div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: sc.color + "15", color: sc.color }}>
                        {sc.icon}{sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FOLIO */}
        {tab === "folio" && (
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900">Your Bill</div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {FOLIO_CHARGES.map((c, i) => (
                <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-slate-50" : ""}`}>
                  <span className="text-lg">{c.type === "ROOM" ? "🛏" : c.type === "MINIBAR" ? "🍷" : "🏖"}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-800">{c.description}</div>
                    <div className="text-[10px] text-slate-400">{c.date}</div>
                  </div>
                  <div className="text-sm font-bold text-slate-900">${c.amount}</div>
                </div>
              ))}
              <div className="border-t-2 border-slate-100 px-4 py-3 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-lg font-extrabold text-blue-700">${totalCharges}</span>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle size={14} />
              Your bill is fully paid. No outstanding balance.
            </div>
          </div>
        )}

        {/* INFO */}
        {tab === "info" && (
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900">Hotel Information</div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              {[
                ["📞 Phone", PROPERTY.phone],
                ["🕒 Check-in", `From ${PROPERTY.checkInTime}`],
                ["🕐 Check-out", `Until ${PROPERTY.checkOutTime}`],
                ["📶 WiFi", "HotelGuest / Password: RES1001"],
                ["🚗 Parking", "Valet available 24/7 — $45/day"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start gap-2 text-sm">
                  <span className="text-slate-400 shrink-0 w-28 text-xs">{k}</span>
                  <span className="text-slate-700 font-medium text-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-slate-100 flex">
        {([["home", "🏠", "Home"], ["chat", "💬", "Chat"], ["requests", "🛎", "Requests"], ["folio", "💳", "Bill"], ["info", "ℹ️", "Info"]] as [Tab, string, string][]).map(([t, emoji, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${tab === t ? "text-blue-600" : "text-slate-400"}`}>
            <span className="text-lg leading-none">{emoji}</span>
            <span className={`text-[9px] font-bold ${tab === t ? "text-blue-600" : "text-slate-400"}`}>{label}</span>
          </button>
        ))}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-w-sm mx-auto p-5 pb-8 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">What do you need?</h3>
              <button onClick={() => { setShowRequestModal(false); setSelectedService(null); setRequestNote(""); }}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            {!selectedService ? (
              <div className="grid grid-cols-4 gap-2">
                {SERVICE_CATEGORIES.map(s => (
                  <button key={s.category} onClick={() => setSelectedService(s)}
                    className="bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-100 rounded-2xl p-3 text-center transition-all">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-[10px] font-semibold text-slate-600 leading-tight">{s.label}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                  <span className="text-2xl">{selectedService.icon}</span>
                  <span className="font-semibold text-slate-900">{selectedService.label}</span>
                  <button onClick={() => setSelectedService(null)} className="ml-auto text-slate-400"><X size={14} /></button>
                </div>
                <textarea value={requestNote} onChange={e => setRequestNote(e.target.value)} rows={3}
                  placeholder="Any additional details? (optional)"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                <button onClick={submitRequest}
                  className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm">
                  Send Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-w-sm mx-auto p-5 pb-8 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Rate Your Stay</h3>
              <button onClick={() => setShowReview(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setRating(i)}>
                  <Star size={36} className={i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                </button>
              ))}
            </div>
            <textarea rows={3} placeholder="Tell us about your experience…"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
            <button onClick={() => setShowReview(false)} disabled={rating === 0}
              className="w-full py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 text-white rounded-2xl font-bold text-sm transition-colors">
              Submit Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
