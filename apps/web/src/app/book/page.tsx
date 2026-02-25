"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users, Search, Star, MapPin, Wifi, Car, Coffee, Dumbbell, Waves } from "lucide-react";

const PROPERTY = {
  name: "Grand Plaza Hotel & Spa",
  slug: "grand-plaza-miami",
  tagline: "Luxury Beachfront Experience in Miami",
  address: "1234 Ocean Drive, Miami Beach, FL 33139",
  stars: 5,
  images: ["/hero1.jpg"],
  amenities: ["Free WiFi","Valet Parking","Pool","Spa","Fitness Center","Restaurant","Bar","Beach Access","Room Service","Concierge"],
  checkInTime: "15:00",
  checkOutTime: "11:00",
  rating: 9.2,
  reviews: 1847,
};

const AMENITY_ICONS: Record<string, any> = {
  "Free WiFi": <Wifi size={14} />,
  "Valet Parking": <Car size={14} />,
  "Pool": <Waves size={14} />,
  "Fitness Center": <Dumbbell size={14} />,
  "Restaurant": <Coffee size={14} />,
};

export default function BookPage() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [showGuests, setShowGuests] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;
    const params = new URLSearchParams({
      checkIn, checkOut, adults: String(adults), children: String(children),
      ...(promoCode ? { promo: promoCode } : {}),
    });
    router.push(`/book/rooms?${params}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Hero */}
      <div className="relative h-[75vh] overflow-hidden">
        {/* Background gradient (replace with real image in production) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A3B6E] via-[#0D5FAA] to-[#0A0A0B]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwaDM2djM2aC0xOGMwLTkuOTQtOC4wNi0xOC0xOC0xOHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L2c+PC9zdmc+')] opacity-20" />

        <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-16 max-w-5xl mx-auto">
          {/* Property badge */}
          <div className="flex items-center gap-1.5 mb-4">
            {Array.from({ length: PROPERTY.stars }).map((_, i) => (
              <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
            ))}
            <span className="text-amber-400 text-xs font-bold ml-1">{PROPERTY.stars}-Star Hotel</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight leading-tight mb-2">{PROPERTY.name}</h1>
          <p className="text-blue-200 text-lg mb-3">{PROPERTY.tagline}</p>

          <div className="flex items-center gap-4 text-sm text-blue-200">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} />
              <span>{PROPERTY.address}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1">
              <span className="font-bold text-emerald-400">{PROPERTY.rating}</span>
              <span className="text-emerald-300">Exceptional · {PROPERTY.reviews.toLocaleString()} reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar — floats over hero */}
      <div className="relative z-20 -mt-10 max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-wrap gap-1">
          {/* Check-in */}
          <div className="flex-1 min-w-36 group">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Check-in</div>
                <input type="date" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="w-px bg-slate-100 my-2" />

          {/* Check-out */}
          <div className="flex-1 min-w-36">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Check-out</div>
                <input type="date" value={checkOut} min={checkIn || today} onChange={e => setCheckOut(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none cursor-pointer" />
              </div>
            </div>
          </div>

          {nights > 0 && (
            <div className="flex items-center px-2">
              <span className="text-[11px] text-slate-400 bg-slate-100 rounded-full px-2.5 py-1 font-semibold whitespace-nowrap">{nights} night{nights > 1 ? "s" : ""}</span>
            </div>
          )}

          <div className="w-px bg-slate-100 my-2" />

          {/* Guests */}
          <div className="relative">
            <button onClick={() => setShowGuests(!showGuests)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors">
              <Users size={15} className="text-slate-400" />
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guests</div>
                <div className="text-sm font-semibold text-slate-900">
                  {adults} adult{adults > 1 ? "s" : ""}
                  {children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}
                </div>
              </div>
            </button>
            {showGuests && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowGuests(false)} />
                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl p-4 z-50 w-64">
                  {[["Adults", adults, setAdults, 1, 10] as const, ["Children", children, setChildren, 0, 6] as const].map(([label, val, set, min, max]) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{label}</div>
                        {label === "Children" && <div className="text-[10px] text-slate-400">Ages 0–12</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => set(Math.max(min, val - 1))}
                          className="w-8 h-8 rounded-full border-2 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-500 font-bold transition-colors">−</button>
                        <span className="text-sm font-bold text-slate-900 w-4 text-center">{val}</span>
                        <button onClick={() => set(Math.min(max, val + 1))}
                          className="w-8 h-8 rounded-full border-2 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-500 font-bold transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-px bg-slate-100 my-2" />

          {/* Promo */}
          <div className="flex-1 min-w-32">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Promo Code</div>
                <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Optional"
                  className="w-full text-sm font-semibold text-slate-900 bg-transparent outline-none placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          {/* Search button */}
          <button onClick={handleSearch} disabled={!checkIn || !checkOut}
            className="flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
            <Search size={16} />
            Search
          </button>
        </div>
      </div>

      {/* Amenities */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-wrap gap-3">
          {PROPERTY.amenities.map(a => (
            <div key={a} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-slate-300">
              {AMENITY_ICONS[a] && <span className="text-blue-400">{AMENITY_ICONS[a]}</span>}
              {a}
            </div>
          ))}
        </div>

        {/* Policies */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: "Check-in", value: `From ${PROPERTY.checkInTime}` },
            { label: "Check-out", value: `Until ${PROPERTY.checkOutTime}` },
            { label: "Cancellation", value: "Free up to 48h" },
            { label: "Pets", value: "Not allowed" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
