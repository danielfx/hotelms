"use client";
import { useState } from "react";
import { useHotelStore } from "@/store/hotel.store";
import { ROOM_TYPES, type BookingSource } from "@/lib/data";
import { fmt, today } from "@/lib/utils";
import { X } from "lucide-react";

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
  const { rooms, addReservation } = useHotelStore();
  const [form, setForm] = useState<Form>({
    guestName: "", guestEmail: "", roomId: "",
    checkIn: today(), checkOut: "", guests: 1,
    source: "Direct", notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const nights = form.checkIn && form.checkOut
    ? Math.max(0, (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000)
    : 0;
  const total = selectedRoom ? selectedRoom.basePrice * nights : 0;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.guestName.trim()) e.guestName = "Name is required";
    if (!form.roomId) e.roomId = "Select a room";
    if (!form.checkIn) e.checkIn = "Required";
    if (!form.checkOut) e.checkOut = "Required";
    if (nights <= 0) e.checkOut = "Must be after check-in";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addReservation({
      id: `RES-${Math.floor(Math.random() * 9000 + 1000)}`,
      guestName: form.guestName,
      guestEmail: form.guestEmail,
      roomId: form.roomId,
      roomNumber: selectedRoom!.number,
      roomType: selectedRoom!.typeName,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      nights,
      guests: form.guests,
      status: "confirmed",
      total,
      source: form.source,
      notes: form.notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">New Reservation</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Guest info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Guest Name *</label>
              <input className={`input ${errors.guestName ? "border-red-300 bg-red-50" : ""}`}
                value={form.guestName} onChange={(e) => set("guestName", e.target.value)}
                placeholder="Full name" />
              {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input className="input" type="email"
                value={form.guestEmail} onChange={(e) => set("guestEmail", e.target.value)}
                placeholder="guest@example.com" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Check-in *</label>
              <input className={`input ${errors.checkIn ? "border-red-300 bg-red-50" : ""}`} type="date"
                value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} />
            </div>
            <div>
              <label className="label">Check-out *</label>
              <input className={`input ${errors.checkOut ? "border-red-300 bg-red-50" : ""}`} type="date"
                value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} />
              {errors.checkOut && <p className="text-red-500 text-xs mt-1">{errors.checkOut}</p>}
            </div>
          </div>

          {/* Room */}
          <div>
            <label className="label">Room *</label>
            <select className={`input ${errors.roomId ? "border-red-300 bg-red-50" : ""}`}
              value={form.roomId} onChange={(e) => set("roomId", e.target.value)}>
              <option value="">Select a room…</option>
              {ROOM_TYPES.map((type) => (
                <optgroup key={type.id} label={type.name}>
                  {rooms.filter((r) => r.typeId === type.id && r.status === "available").map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number} — {fmt(r.basePrice)}/night (Floor {r.floor})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Guests</label>
              <input className="input" type="number" min={1} max={selectedRoom?.capacity ?? 4}
                value={form.guests} onChange={(e) => set("guests", parseInt(e.target.value))} />
            </div>
            <div>
              <label className="label">Source</label>
              <select className="input" value={form.source} onChange={(e) => set("source", e.target.value as BookingSource)}>
                {(["Direct", "Booking.com", "Expedia", "Airbnb", "Phone", "Walk-in"] as BookingSource[]).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2}
              value={form.notes} onChange={(e) => set("notes", e.target.value)}
              placeholder="Special requests, arrival time…" />
          </div>

          {/* Summary */}
          {nights > 0 && selectedRoom && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-700 mb-2">Booking Summary</div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{nights} night{nights > 1 ? "s" : ""} × {fmt(selectedRoom.basePrice)}</span>
                <span className="font-extrabold text-slate-900">{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-[2]">Create Reservation</button>
        </div>
      </div>
    </div>
  );
}
