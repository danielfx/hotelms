"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Building2, Save, MapPin, Globe, Phone, Mail, Clock, Wifi, Shield, Bell, Loader2 } from "lucide-react";

const DEFAULT_PROPERTY = {
  name: "", code: "", type: "HOTEL",
  address: "", city: "", state: "", country: "", postalCode: "",
  phone: "", email: "", website: "",
  timezone: "America/New_York", currency: "USD", checkInTime: "15:00", checkOutTime: "11:00",
  totalRooms: 0, totalFloors: 0, starRating: 0,
  taxRate: 0, cityTaxRate: 0, resortFee: 0,
};

export default function SettingsPage() {
  const [tab, setTab] = useState<"general" | "operations" | "notifications">("general");
  const [form, setForm] = useState(DEFAULT_PROPERTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await api.properties.getCurrent();
        if (cancelled) return;
        if (data) {
          setForm({
            name: data.name ?? "",
            code: data.code ?? "",
            type: data.type ?? "HOTEL",
            address: data.address ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            country: data.country ?? "",
            postalCode: data.postalCode ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            website: data.website ?? "",
            timezone: data.timezone ?? "America/New_York",
            currency: data.currency ?? "USD",
            checkInTime: data.checkInTime ?? "15:00",
            checkOutTime: data.checkOutTime ?? "11:00",
            totalRooms: Number(data.totalRooms ?? 0),
            totalFloors: Number(data.totalFloors ?? 0),
            starRating: Number(data.starRating ?? 0),
            taxRate: Number(data.taxRate ?? 0),
            cityTaxRate: Number(data.cityTaxRate ?? 0),
            resortFee: Number(data.resortFee ?? 0),
          });
        }
      } catch (err) {
        console.error("Failed to load property settings:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      await api.properties.update({
        name: form.name,
        code: form.code,
        type: form.type,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        postalCode: form.postalCode,
        phone: form.phone,
        email: form.email,
        website: form.website,
        timezone: form.timezone,
        currency: form.currency,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        totalRooms: form.totalRooms,
        totalFloors: form.totalFloors,
        starRating: form.starRating,
        taxRate: form.taxRate,
        cityTaxRate: form.cityTaxRate,
        resortFee: form.resortFee,
      });
      setSaveMsg("Settings saved successfully.");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err: any) {
      setSaveMsg(`Failed to save: ${err.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general" as const, label: "General", icon: Building2 },
    { id: "operations" as const, label: "Operations", icon: Clock },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="ml-3 text-slate-500 text-sm">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Property Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your property configuration</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm ${saveMsg.startsWith("Failed") ? "text-red-600" : "text-green-600"}`}>{saveMsg}</span>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-48 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${tab === t.id ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">
          {tab === "general" && (
            <div className="space-y-6">
              <h3 className="font-semibold text-slate-900">General Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Property Name", key: "name", icon: Building2 },
                  { label: "Property Code", key: "code", icon: Shield },
                  { label: "Phone", key: "phone", icon: Phone },
                  { label: "Email", key: "email", icon: Mail },
                  { label: "Website", key: "website", icon: Globe },
                  { label: "Address", key: "address", icon: MapPin },
                  { label: "City", key: "city", icon: MapPin },
                  { label: "State", key: "state", icon: MapPin },
                  { label: "Country", key: "country", icon: Globe },
                  { label: "Postal Code", key: "postalCode", icon: MapPin },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm text-slate-600 mb-1">{field.label}</label>
                    <div className="relative">
                      <field.icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={(form as any)[field.key]}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Total Rooms</label>
                  <input type="number" value={form.totalRooms} onChange={e => setForm({ ...form, totalRooms: +e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Total Floors</label>
                  <input type="number" value={form.totalFloors} onChange={e => setForm({ ...form, totalFloors: +e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Star Rating</label>
                  <input type="number" value={form.starRating} min={1} max={5} onChange={e => setForm({ ...form, starRating: +e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          )}

          {tab === "operations" && (
            <div className="space-y-6">
              <h3 className="font-semibold text-slate-900">Operations Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Check-in Time</label>
                  <input type="time" value={form.checkInTime} onChange={e => setForm({ ...form, checkInTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Check-out Time</label>
                  <input type="time" value={form.checkOutTime} onChange={e => setForm({ ...form, checkOutTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Timezone</label>
                  <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 pt-4">Tax & Fees</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Tax Rate (%)</label>
                  <input type="number" step="0.01" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: +e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">City Tax Rate (%)</label>
                  <input type="number" step="0.01" value={form.cityTaxRate} onChange={e => setForm({ ...form, cityTaxRate: +e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Resort Fee ($)</label>
                  <input type="number" step="0.01" value={form.resortFee} onChange={e => setForm({ ...form, resortFee: +e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-6">
              <h3 className="font-semibold text-slate-900">Notification Preferences</h3>
              {[
                { label: "New Reservation", desc: "Get notified when a new reservation is created", enabled: true },
                { label: "Cancellations", desc: "Get notified when a reservation is cancelled", enabled: true },
                { label: "Guest Check-in", desc: "Get notified when guests check in", enabled: false },
                { label: "Housekeeping Alerts", desc: "Get notified about housekeeping issues", enabled: true },
                { label: "Channel Sync Errors", desc: "Get notified when channel sync fails", enabled: true },
                { label: "Revenue Alerts", desc: "Get notified about revenue milestones", enabled: false },
              ].map(n => (
                <div key={n.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{n.label}</div>
                    <div className="text-xs text-slate-500">{n.desc}</div>
                  </div>
                  <button className={`w-10 h-6 rounded-full transition-colors ${n.enabled ? "bg-blue-600" : "bg-slate-200"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${n.enabled ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
