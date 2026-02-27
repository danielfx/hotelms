"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useHotelStore } from "@/store/hotel.store";
import { ROOM_TYPES, type BookingSource } from "@/lib/data";
import { fmt, today } from "@/lib/utils";
import { X } from "lucide-react";
import api from "@/lib/api";

interface Form {
  guestName: string;
  guestEmail: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  source: BookingSource;
  notes: string;
}

export function NewReservationModal({ onClose }: { onClose: () => void }) {
  const { rooms, fetchData } = useHotelStore();
  const t = useTranslations("newReservation");
  const tc = useTranslations("common");
  const [form, setForm] = useState<Form>({
    guestName: "", guestEmail: "", roomId: "",
    checkIn: today(), checkOut: "", guests: 1,
    source: "Direct", notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const nights = form.checkIn && form.checkOut
    ? Math.max(0, (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000)
    : 0;
  const total = selectedRoom ? selectedRoom.basePrice * nights : 0;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.guestName.trim()) e.guestName = t("nameRequired");
    if (!form.roomId) e.roomId = t("selectRoomError");
    if (!form.checkIn) e.checkIn = t("required");
    if (!form.checkOut) e.checkOut = t("required");
    if (nights <= 0) e.checkOut = t("mustBeAfterCheckIn");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const nameParts = form.guestName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      await api.reservations.create({
        roomId: form.roomId,
        guestData: { firstName, lastName, email: form.guestEmail },
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: form.guests,
        source: form.source === "Booking.com" ? "BOOKING_COM" : form.source === "Walk-in" ? "WALK_IN" : form.source.toUpperCase(),
        notes: form.notes,
      });
      fetchData();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to create reservation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{t("title")}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Guest info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="col-span-1 md:col-span-2">
              <label className="label">{t("guestName")} *</label>
              <input className={`input ${errors.guestName ? "border-red-300 bg-red-50" : ""}`}
                value={form.guestName} onChange={(e) => set("guestName", e.target.value)}
                placeholder={t("fullName")} />
              {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName}</p>}
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="label">{t("guestEmail")}</label>
              <input className="input" type="email"
                value={form.guestEmail} onChange={(e) => set("guestEmail", e.target.value)}
                placeholder="guest@example.com" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t("checkIn")} *</label>
              <input className={`input ${errors.checkIn ? "border-red-300 bg-red-50" : ""}`} type="date"
                value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} />
            </div>
            <div>
              <label className="label">{t("checkOut")} *</label>
              <input className={`input ${errors.checkOut ? "border-red-300 bg-red-50" : ""}`} type="date"
                value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} />
              {errors.checkOut && <p className="text-red-500 text-xs mt-1">{errors.checkOut}</p>}
            </div>
          </div>

          {/* Room */}
          <div>
            <label className="label">{t("room")} *</label>
            <select className={`input ${errors.roomId ? "border-red-300 bg-red-50" : ""}`}
              value={form.roomId} onChange={(e) => set("roomId", e.target.value)}>
              <option value="">{t("selectRoom")}</option>
              {ROOM_TYPES.map((type) => (
                <optgroup key={type.id} label={type.name}>
                  {rooms.filter((r) => r.typeId === type.id && r.status === "available").map((r) => (
                    <option key={r.id} value={r.id}>
                      {tc("room")} {r.number} — {fmt(r.basePrice)}/{tc("night")} ({tc("floor")} {r.floor})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t("guests")}</label>
              <input className="input" type="number" min={1} max={selectedRoom?.capacity ?? 4}
                value={form.guests} onChange={(e) => set("guests", parseInt(e.target.value))} />
            </div>
            <div>
              <label className="label">{t("source")}</label>
              <select className="input" value={form.source} onChange={(e) => set("source", e.target.value as BookingSource)}>
                {(["Direct", "Booking.com", "Expedia", "Airbnb", "Phone", "Walk-in"] as BookingSource[]).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">{t("notes")}</label>
            <textarea className="input resize-none" rows={2}
              value={form.notes} onChange={(e) => set("notes", e.target.value)}
              placeholder={t("notesPlaceholder")} />
          </div>

          {/* Summary */}
          {nights > 0 && selectedRoom && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-700 mb-2">{t("bookingSummary")}</div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{nights} {nights > 1 ? tc("nights") : tc("night")} × {fmt(selectedRoom.basePrice)}</span>
                <span className="font-extrabold text-slate-900">{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1">{tc("cancel")}</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-[2] disabled:opacity-50">{saving ? tc("saving") : t("createReservation")}</button>
        </div>
      </div>
    </div>
  );
}
