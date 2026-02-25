"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronRight, Star, Users, BedDouble, Maximize, Coffee, CheckCircle, X, ChevronDown } from "lucide-react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MEAL_PLAN_LABELS: Record<string, string> = {
  ROOM_ONLY: "Room Only",
  BED_BREAKFAST: "Bed & Breakfast",
  HALF_BOARD: "Half Board",
  FULL_BOARD: "Full Board",
  ALL_INCLUSIVE: "All Inclusive",
};

const MEAL_PLAN_ICONS: Record<string, string> = {
  ROOM_ONLY: "🛏", BED_BREAKFAST: "☕", HALF_BOARD: "🍽", FULL_BOARD: "🍴", ALL_INCLUSIVE: "🌟",
};

const CANCEL_LABELS: Record<string, { label: string; color: string }> = {
  FREE: { label: "Free cancellation", color: "#10B981" },
  MODERATE: { label: "Free cancellation 48h before", color: "#3B82F6" },
  STRICT: { label: "Strict — limited refund", color: "#F59E0B" },
  NON_REFUNDABLE: { label: "Non-refundable", color: "#EF4444" },
};

const MOCK_RESULTS = [
  {
    roomType: { code: "STD", name: "Standard Room", description: "Comfortable room with modern amenities and city view. Features a premium king bed, marble bathroom, and 48\" Smart TV.", capacity: 2, bedType: "King", squareMeters: 28, amenities: ["Free WiFi","Air Conditioning","Minibar","Safe","Hair Dryer","Coffee Maker","Smart TV","City View"], images: [] },
    available: 4,
    rates: [
      { ratePlan: { id: "p1", name: "Best Available Rate", code: "BAR", mealPlan: "ROOM_ONLY", cancellationPolicy: "MODERATE", cancellationHours: 48, isRefundable: true, description: null }, totalRoomRate: 267, adr: 89, tax: 18.69, cityTax: 0, resortFee: 35, totalAmount: 320.69, breakdown: [], promoApplied: false, promoDiscount: 0 },
      { ratePlan: { id: "p2", name: "Non-Refundable Saver", code: "NRF", mealPlan: "ROOM_ONLY", cancellationPolicy: "NON_REFUNDABLE", cancellationHours: 0, isRefundable: false, description: "Save 15% — non-refundable" }, totalRoomRate: 226.95, adr: 75.65, tax: 15.89, cityTax: 0, resortFee: 35, totalAmount: 277.84, breakdown: [], promoApplied: false, promoDiscount: 0 },
      { ratePlan: { id: "p3", name: "Bed & Breakfast Package", code: "BB", mealPlan: "BED_BREAKFAST", cancellationPolicy: "MODERATE", cancellationHours: 48, isRefundable: true, description: "Includes daily breakfast for 2" }, totalRoomRate: 333.75, adr: 111.25, tax: 23.36, cityTax: 0, resortFee: 35, totalAmount: 392.11, breakdown: [], promoApplied: false, promoDiscount: 0 },
    ],
    lowestRate: 277.84,
  },
  {
    roomType: { code: "DLX", name: "Deluxe Ocean Room", description: "Spacious deluxe room with stunning ocean views from private balcony. King bed with premium Frette linens, rain shower, and complimentary welcome amenity.", capacity: 2, bedType: "King + Sofa", squareMeters: 38, amenities: ["Free WiFi","Ocean View","Private Balcony","Air Conditioning","Minibar","Safe","Espresso Machine","Smart TV","Bathrobe & Slippers","Turndown Service"], images: [] },
    available: 2,
    rates: [
      { ratePlan: { id: "p1", name: "Best Available Rate", code: "BAR", mealPlan: "ROOM_ONLY", cancellationPolicy: "MODERATE", cancellationHours: 48, isRefundable: true, description: null }, totalRoomRate: 417, adr: 139, tax: 29.19, cityTax: 0, resortFee: 35, totalAmount: 481.19, breakdown: [], promoApplied: false, promoDiscount: 0 },
      { ratePlan: { id: "p2", name: "Non-Refundable Saver", code: "NRF", mealPlan: "ROOM_ONLY", cancellationPolicy: "NON_REFUNDABLE", cancellationHours: 0, isRefundable: false, description: "Save 15%" }, totalRoomRate: 354.45, adr: 118.15, tax: 24.81, cityTax: 0, resortFee: 35, totalAmount: 414.26, breakdown: [], promoApplied: false, promoDiscount: 0 },
    ],
    lowestRate: 414.26,
  },
  {
    roomType: { code: "STE", name: "Ocean Suite", description: "Lavish suite with panoramic ocean views, separate living area, whirlpool tub, and exclusive butler service. The ultimate Miami Beach experience.", capacity: 4, bedType: "King + King", squareMeters: 72, amenities: ["Free WiFi","Panoramic Ocean View","2 Private Balconies","Butler Service","Whirlpool Tub","Rain Shower","Full Kitchen","Bang & Olufsen Sound","Premium Minibar","24h Room Service","Airport Transfer"], images: [] },
    available: 1,
    rates: [
      { ratePlan: { id: "p1", name: "Best Available Rate", code: "BAR", mealPlan: "ROOM_ONLY", cancellationPolicy: "FREE", cancellationHours: 24, isRefundable: true, description: null }, totalRoomRate: 867, adr: 289, tax: 60.69, cityTax: 0, resortFee: 35, totalAmount: 962.69, breakdown: [], promoApplied: false, promoDiscount: 0 },
    ],
    lowestRate: 962.69,
  },
];

const fmt = (n: number) => `$${n.toFixed(2)}`;
const fmtInt = (n: number) => `$${Math.round(n)}`;

// ─── ROOM CARD ────────────────────────────────────────────────────────────────

function RoomCard({
  result, nights, onSelect
}: {
  result: typeof MOCK_RESULTS[0];
  nights: number;
  onSelect: (roomTypeCode: string, ratePlanId: string, total: number, rateName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { roomType, rates, available } = result;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all">
      {/* Room header */}
      <div className="flex gap-0 flex-col md:flex-row">
        {/* Room "image" placeholder */}
        <div className="md:w-64 h-44 md:h-auto bg-gradient-to-br from-slate-700 to-slate-900 relative shrink-0 flex items-center justify-center">
          <BedDouble size={40} className="text-white/20" />
          {available <= 2 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              Only {available} left!
            </div>
          )}
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{roomType.name}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><BedDouble size={12} /> {roomType.bedType}</span>
                <span className="flex items-center gap-1"><Maximize size={12} /> {roomType.squareMeters}m²</span>
                <span className="flex items-center gap-1"><Users size={12} /> Up to {roomType.capacity} guests</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">From</div>
              <div className="text-2xl font-extrabold text-slate-900">{fmtInt(result.lowestRate / nights)}</div>
              <div className="text-xs text-slate-400">per night</div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{roomType.description}</p>

          {/* Amenity pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {roomType.amenities.slice(0, 5).map(a => (
              <span key={a} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{a}</span>
            ))}
            {roomType.amenities.length > 5 && (
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">+{roomType.amenities.length - 5} more</span>
            )}
          </div>

          <button onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
            {expanded ? "Hide" : "Show"} all rates
            <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Rates */}
      <div className="border-t border-slate-100">
        {(expanded ? rates : rates.slice(0, 1)).map((rate, i) => {
          const cc = CANCEL_LABELS[rate.ratePlan.cancellationPolicy];
          return (
            <div key={rate.ratePlan.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-slate-50" : ""} hover:bg-slate-50/50 transition-colors`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">{rate.ratePlan.name}</span>
                  {i === 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Best value</span>}
                </div>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span>{MEAL_PLAN_ICONS[rate.ratePlan.mealPlan]}</span>
                    {MEAL_PLAN_LABELS[rate.ratePlan.mealPlan]}
                  </span>
                  <span className="flex items-center gap-1 font-semibold" style={{ color: cc.color }}>
                    <CheckCircle size={10} />{cc.label}
                  </span>
                </div>
                {rate.ratePlan.description && (
                  <div className="text-[10px] text-slate-400 mt-1">{rate.ratePlan.description}</div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-900">{fmt(rate.totalAmount)}</div>
                  <div className="text-[10px] text-slate-400">incl. taxes & fees · {nights}n</div>
                  <div className="text-[10px] text-slate-500">{fmt(rate.adr)}/night</div>
                </div>
                <button onClick={() => onSelect(roomType.code, rate.ratePlan.id, rate.totalAmount, rate.ratePlan.name)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 whitespace-nowrap">
                  Select <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function RoomsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const adults = Number(params.get("adults") ?? 1);
  const children = Number(params.get("children") ?? 0);
  const promo = params.get("promo") ?? "";

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 1;

  const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const handleSelect = (roomTypeCode: string, ratePlanId: string, total: number, rateName: string) => {
    const q = new URLSearchParams({
      checkIn, checkOut, adults: String(adults), children: String(children),
      roomTypeCode, ratePlanId, total: String(total), rateName,
      ...(promo ? { promo } : {}),
    });
    router.push(`/book/checkout?${q}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-bold text-slate-900">Grand Plaza Hotel & Spa</h1>
            <div className="text-xs text-slate-400 mt-0.5">
              {checkIn ? fmtDate(checkIn) : "—"} → {checkOut ? fmtDate(checkOut) : "—"} · {nights} night{nights > 1 ? "s" : ""} · {adults} adult{adults > 1 ? "s" : ""}
            </div>
          </div>
          <button onClick={() => router.back()} className="text-xs text-blue-600 hover:underline font-semibold">
            ← Modify Search
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-xl">{MOCK_RESULTS.length} Room Types Available</h2>
            {promo && <div className="text-xs text-emerald-600 font-semibold mt-0.5">🎉 Promo code "{promo}" applied</div>}
          </div>
          <div className="text-xs text-slate-400">Prices include all taxes & fees</div>
        </div>

        {MOCK_RESULTS.map(result => (
          <RoomCard
            key={result.roomType.code}
            result={result}
            nights={nights}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading…</div>}><RoomsContent /></Suspense>;
}
