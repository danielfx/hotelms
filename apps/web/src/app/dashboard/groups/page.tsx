"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Users, Calendar, BedDouble, Plus, Building, DollarSign, Loader2, X, Check } from "lucide-react";
import api from "@/lib/api";

const statusColors: Record<string, string> = {
  DEFINITE: "bg-green-50 text-green-700",
  TENTATIVE: "bg-amber-50 text-amber-700",
  INQUIRY: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function NewGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations("groups");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalRooms, setTotalRooms] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.groups.create({
        name: name.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        checkIn,
        checkOut,
        totalRooms: Number(totalRooms) || 0,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to create group");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{t("newGroupBooking")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("groupName")}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Smith Wedding"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("contactName")}</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("contactEmail")}</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("contactPhone")}</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("totalRooms")}</label>
              <input
                type="number"
                value={totalRooms}
                onChange={e => setTotalRooms(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("checkInDate")}</label>
              <input
                type="date"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("checkOutDate")}</label>
              <input
                type="date"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">{tc("cancel")}</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? tc("creating") : t("createGroup")}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewEventSpaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations("groups");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [halfDayRate, setHalfDayRate] = useState("");
  const [fullDayRate, setFullDayRate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.groups.createEventSpace({
        name: name.trim(),
        capacity: Number(capacity) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        halfDayRate: Number(halfDayRate) || 0,
        fullDayRate: Number(fullDayRate) || 0,
        description: description.trim(),
      });
      onCreated();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to create event space");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{t("newEventSpaceTitle")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("spaceName")}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Grand Ballroom"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("capacity")}</label>
              <input
                type="number"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("hourlyRate")}</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("halfDayRate")}</label>
              <input
                type="number"
                value={halfDayRate}
                onChange={e => setHalfDayRate(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("fullDayRate")}</label>
              <input
                type="number"
                value={fullDayRate}
                onChange={e => setFullDayRate(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{tc("description")}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t("describeEventSpace")}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">{tc("cancel")}</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? tc("creating") : t("createSpace")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const t = useTranslations("groups");
  const tc = useTranslations("common");
  const [tab, setTab] = useState<"groups" | "events">("groups");
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [eventSpaces, setEventSpaces] = useState<any[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEventSpaceModal, setShowEventSpaceModal] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedSpaceId, setExpandedSpaceId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, spacesRes] = await Promise.allSettled([
        api.groups.list(),
        api.groups.listEventSpaces(),
      ]);
      if (groupsRes.status === "fulfilled") setGroups(Array.isArray(groupsRes.value) ? groupsRes.value : []);
      if (spacesRes.status === "fulfilled") setEventSpaces(Array.isArray(spacesRes.value) ? spacesRes.value : []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const mappedGroups = useMemo(() => groups.map((g: any) => ({
    id: g.id,
    name: g.name || "Unnamed Group",
    status: (g.status || "INQUIRY").toUpperCase(),
    contactName: g.contactName || g.contact?.name || "\u2014",
    contactEmail: g.contactEmail || g.contact?.email || "",
    contactPhone: g.contactPhone || g.contact?.phone || "",
    companyName: g.companyName || g.company || null,
    checkIn: g.checkIn || g.checkInDate || g.startDate || "\u2014",
    checkOut: g.checkOut || g.checkOutDate || g.endDate || "\u2014",
    totalRooms: Number(g.totalRooms ?? g.roomsBlocked ?? 0),
    confirmedRooms: Number(g.confirmedRooms ?? g.roomsPickedUp ?? 0),
    baseRate: Number(g.baseRate ?? g.rate ?? 0),
    notes: g.notes || "",
    _raw: g,
  })), [groups]);

  const mappedSpaces = useMemo(() => eventSpaces.map((e: any) => ({
    id: e.id,
    name: e.name || "Unnamed Space",
    capacity: Number(e.capacity ?? 0),
    hourlyRate: Number(e.hourlyRate ?? e.rate ?? 0),
    halfDayRate: Number(e.halfDayRate ?? 0),
    fullDayRate: Number(e.fullDayRate ?? 0),
    description: e.description || "",
    bookingsThisMonth: Number(e.bookingsThisMonth ?? e.bookingCount ?? 0),
    _raw: e,
  })), [eventSpaces]);

  const activeGroups = useMemo(() => mappedGroups.filter(g => g.status !== "CANCELLED").length, [mappedGroups]);
  const totalRoomsBlocked = useMemo(() => mappedGroups.reduce((s, g) => s + g.totalRooms, 0), [mappedGroups]);
  const totalEventsThisMonth = useMemo(() => mappedSpaces.reduce((s, e) => s + e.bookingsThisMonth, 0), [mappedSpaces]);

  return (
    <div className="space-y-6">
      {showGroupModal && <NewGroupModal onClose={() => setShowGroupModal(false)} onCreated={loadData} />}
      {showEventSpaceModal && <NewEventSpaceModal onClose={() => setShowEventSpaceModal(false)} onCreated={loadData} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          onClick={() => { tab === "groups" ? setShowGroupModal(true) : setShowEventSpaceModal(true); }}
        >
          <Plus size={16} /> {tab === "groups" ? t("newGroup") : t("newEventSpace")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("activeGroups"), value: activeGroups, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: t("totalRoomsBlocked"), value: totalRoomsBlocked, icon: BedDouble, color: "bg-purple-50 text-purple-600" },
          { label: t("eventSpaces"), value: mappedSpaces.length, icon: Building, color: "bg-green-50 text-green-600" },
          { label: t("eventsThisMonth"), value: totalEventsThisMonth, icon: Calendar, color: "bg-amber-50 text-amber-600" },
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

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["groups", "events"] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === tb ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {tb === "groups" ? t("groupBookings") : t("eventSpacesTab")}
          </button>
        ))}
      </div>

      {tab === "groups" && (
        <div className="space-y-4">
          {mappedGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t("noGroupBookings")}</h3>
              <p className="text-sm text-slate-500">{t("noGroupBookingsDesc")}</p>
            </div>
          ) : mappedGroups.map(g => (
            <div
              key={g.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedGroupId(expandedGroupId === g.id ? null : g.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{g.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[g.status] || "bg-slate-100 text-slate-600"}`}>{g.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{g.contactName}{g.companyName ? ` \u2014 ${g.companyName}` : ""}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">${g.baseRate}<span className="text-xs text-slate-500 font-normal">/{tc("night")}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  {g.checkIn} {tc("to").toLowerCase()} {g.checkOut}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BedDouble size={14} className="text-slate-400" />
                  {g.confirmedRooms}/{g.totalRooms} {t("rooms")}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign size={14} className="text-slate-400" />
                  {t("estRevenue")} ${(g.totalRooms * g.baseRate * 2).toLocaleString()}
                </div>
                {g.notes && (
                  <div className="text-sm text-slate-500 truncate">{g.notes}</div>
                )}
              </div>
              {g.status === "DEFINITE" && g.totalRooms > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{t("pickup")}: {Math.round((g.confirmedRooms / g.totalRooms) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(g.confirmedRooms / g.totalRooms) * 100}%` }} />
                  </div>
                </div>
              )}
              {expandedGroupId === g.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-1">
                  <div><span className="font-medium text-slate-700">{t("contact")}:</span> {g.contactName}</div>
                  {g.contactEmail && <div><span className="font-medium text-slate-700">{tc("email")}:</span> {g.contactEmail}</div>}
                  {g.contactPhone && <div><span className="font-medium text-slate-700">{tc("phone")}:</span> {g.contactPhone}</div>}
                  {g.companyName && <div><span className="font-medium text-slate-700">{t("company")}:</span> {g.companyName}</div>}
                  <div><span className="font-medium text-slate-700">{tc("status")}:</span> {g.status}</div>
                  <div><span className="font-medium text-slate-700">{t("checkInDate")}:</span> {g.checkIn}</div>
                  <div><span className="font-medium text-slate-700">{t("checkOutDate")}:</span> {g.checkOut}</div>
                  <div><span className="font-medium text-slate-700">{t("roomsBlocked")}:</span> {g.confirmedRooms} {t("confirmed")} / {g.totalRooms} {t("blocked")}</div>
                  <div><span className="font-medium text-slate-700">{t("baseRate")}:</span> ${g.baseRate}/{tc("night")}</div>
                  {g.notes && <div><span className="font-medium text-slate-700">{tc("notes")}:</span> {g.notes}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "events" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mappedSpaces.length === 0 ? (
            <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Building size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t("noEventSpaces")}</h3>
              <p className="text-sm text-slate-500">{t("noEventSpacesDesc")}</p>
            </div>
          ) : mappedSpaces.map(e => (
            <div
              key={e.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedSpaceId(expandedSpaceId === e.id ? null : e.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{e.name}</h3>
                <span className="text-sm text-slate-500">${e.hourlyRate}/hr</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Users size={14} /> {t("capacity")}: {e.capacity}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {e.bookingsThisMonth} {t("bookings")}</span>
              </div>
              {expandedSpaceId === e.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-1">
                  <div><span className="font-medium text-slate-700">{tc("name")}:</span> {e.name}</div>
                  <div><span className="font-medium text-slate-700">{t("capacity")}:</span> {e.capacity}</div>
                  <div><span className="font-medium text-slate-700">{t("hourlyRate")}:</span> ${e.hourlyRate}/hr</div>
                  {e.halfDayRate > 0 && <div><span className="font-medium text-slate-700">{t("halfDayRate")}:</span> ${e.halfDayRate}</div>}
                  {e.fullDayRate > 0 && <div><span className="font-medium text-slate-700">{t("fullDayRate")}:</span> ${e.fullDayRate}</div>}
                  {e.description && <div><span className="font-medium text-slate-700">{tc("description")}:</span> {e.description}</div>}
                  <div><span className="font-medium text-slate-700">{t("bookingsThisMonth")}:</span> {e.bookingsThisMonth}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
