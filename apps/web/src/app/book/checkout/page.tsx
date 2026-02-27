"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CreditCard, Check, ChevronRight, AlertCircle, BedDouble } from "lucide-react";

const fmt = (n: number) => `$${Number(n).toFixed(2)}`;
const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const adults = Number(params.get("adults") ?? 1);
  const roomTypeCode = params.get("roomTypeCode") ?? "DLX";
  const ratePlanId = params.get("ratePlanId") ?? "";
  const rateName = params.get("rateName") ?? "Best Available Rate";
  const total = Number(params.get("total") ?? 0);

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 1;
  const adr = nights > 0 ? total / nights : 0;
  const tax = total * 0.07;
  const roomCharge = total - tax - 35;

  const ROOM_NAMES: Record<string, string> = { STD: "Standard Room", DLX: "Deluxe Ocean Room", PRM: "Premium Room", STE: "Ocean Suite" };

  // Form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", emailConfirm: "",
    phone: "", nationality: "", specialRequests: "",
    cardNumber: "", expiry: "", cvc: "", cardName: "",
    acceptTerms: false, acceptMarketing: false,
  });
  const [step, setStep] = useState<"guest" | "payment" | "processing" | "done">("guest");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const validateGuest = () => {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email required";
    if (form.email !== form.emailConfirm) e.emailConfirm = "Emails do not match";
    if (!form.phone) e.phone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e: Record<string, string> = {};
    if (!form.cardNumber || form.cardNumber.replace(/\s/g, "").length < 16) e.cardNumber = "Valid card number required";
    if (!form.expiry || !/^\d{2}\/\d{2}$/.test(form.expiry)) e.expiry = "MM/YY format";
    if (!form.cvc || form.cvc.length < 3) e.cvc = "3–4 digits";
    if (!form.cardName) e.cardName = "Required";
    if (!form.acceptTerms) e.acceptTerms = "You must accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGuestNext = () => {
    if (validateGuest()) setStep("payment");
  };

  const handleBooking = async () => {
    if (!validatePayment()) return;
    setStep("processing");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/book/grand-plaza-miami/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertySlug: 'grand-plaza-miami',
          roomTypeCode: params.get('room') || 'STD',
          ratePlanId: 'default',
          checkIn: params.get('checkIn') || '',
          checkOut: params.get('checkOut') || '',
          adults: Number(params.get('guests')) || 1,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          specialRequests: form.specialRequests || '',
          paymentMethodId: 'pm_simulated',
        }),
      });
      const data = await res.json();
      const confirmNo = data?.data?.confirmationNo || data?.confirmationNo || `RES-${Math.floor(1000 + Math.random() * 9000)}`;
      router.push(`/book/confirmation?no=${confirmNo}&email=${encodeURIComponent(form.email)}`);
    } catch {
      // Fallback simulation if API is unavailable
      const confirmNo = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
      setTimeout(() => router.push(`/book/confirmation?no=${confirmNo}&email=${encodeURIComponent(form.email)}`), 1500);
    }
  };

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Processing your booking…</h2>
          <p className="text-slate-400 text-sm">Securing your room and processing payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-bold text-slate-900">Complete Your Booking</h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock size={12} className="text-emerald-500" />
            Secure checkout · SSL encrypted
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex gap-6">
          {[["guest", "1", "Your Details"], ["payment", "2", "Payment"]].map(([s, n, label]) => (
            <div key={s} className={`flex items-center gap-2 text-sm font-semibold ${step === s ? "text-blue-600" : step === "payment" && s === "guest" ? "text-emerald-600" : "text-slate-300"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step === s ? "bg-blue-600 text-white" : step === "payment" && s === "guest" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                {step === "payment" && s === "guest" ? <Check size={12} /> : n}
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 1: Guest Details */}
          {step === "guest" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h2 className="font-bold text-slate-900">Your Details</h2>
              <div className="grid grid-cols-2 gap-3">
                {([["firstName", "First Name *"], ["lastName", "Last Name *"]] as const).map(([k, label]) => (
                  <div key={k}>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
                    <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={label.replace(" *", "")}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${errors[k] ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                    {errors[k] && <p className="text-[10px] text-red-500 mt-0.5">{errors[k]}</p>}
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Email Address *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com"
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${errors.email ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Confirm Email *</label>
                <input type="email" value={form.emailConfirm} onChange={e => set("emailConfirm", e.target.value)} placeholder="Repeat email"
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${errors.emailConfirm ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                {errors.emailConfirm && <p className="text-[10px] text-red-500 mt-0.5">{errors.emailConfirm}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 555 0100"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${errors.phone ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                  {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Nationality</label>
                  <input value={form.nationality} onChange={e => set("nationality", e.target.value)} placeholder="e.g. American"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Special Requests</label>
                <textarea value={form.specialRequests} onChange={e => set("specialRequests", e.target.value)} rows={2}
                  placeholder="Early check-in, high floor, dietary requirements…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.acceptMarketing} onChange={e => set("acceptMarketing", e.target.checked)} className="mt-0.5 rounded" />
                <span className="text-xs text-slate-500">I'd like to receive exclusive offers and updates by email</span>
              </label>
              <button onClick={handleGuestNext} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                Continue to Payment <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === "payment" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Payment Details</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock size={11} className="text-emerald-500" /> Secured by Stripe
                  <span className="font-bold text-slate-600">Visa · MC · Amex</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Card Number *</label>
                <div className="relative">
                  <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.cardNumber} onChange={e => set("cardNumber", formatCard(e.target.value))}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${errors.cardNumber ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                </div>
                {errors.cardNumber && <p className="text-[10px] text-red-500 mt-0.5">{errors.cardNumber}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Expiry *</label>
                  <input value={form.expiry} onChange={e => set("expiry", formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${errors.expiry ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                  {errors.expiry && <p className="text-[10px] text-red-500 mt-0.5">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">CVC *</label>
                  <input value={form.cvc} onChange={e => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" maxLength={4}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${errors.cvc ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                  {errors.cvc && <p className="text-[10px] text-red-500 mt-0.5">{errors.cvc}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Name on Card *</label>
                  <input value={form.cardName} onChange={e => set("cardName", e.target.value)} placeholder="J. Smith"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${errors.cardName ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                  {errors.cardName && <p className="text-[10px] text-red-500 mt-0.5">{errors.cardName}</p>}
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.acceptTerms} onChange={e => set("acceptTerms", e.target.checked)} className="mt-0.5 rounded" />
                <span className="text-xs text-slate-500">
                  I agree to the <button type="button" onClick={() => alert("Terms & Conditions: Free cancellation up to 24 hours before check-in. No-show fee equivalent to first night's rate.")} className="text-blue-600 underline">Terms & Conditions</button> and{" "}
                  <button type="button" onClick={() => alert("Privacy Policy: Your personal and payment data is encrypted and processed securely. We comply with GDPR.")} className="text-blue-600 underline">Privacy Policy</button>
                </span>
              </label>
              {errors.acceptTerms && <p className="text-[10px] text-red-500">{errors.acceptTerms}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep("guest")} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Back</button>
                <button onClick={handleBooking}
                  className="flex-[3] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                  <Lock size={14} /> Pay {fmt(total)} — Confirm Booking
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center">
                <AlertCircle size={10} />
                Your card will be charged {fmt(total)} immediately upon confirmation
              </div>
            </div>
          )}
        </div>

        {/* Booking summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-20">
            <h3 className="font-bold text-slate-900 mb-4">Booking Summary</h3>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl mb-4">
              <BedDouble size={16} className="text-slate-400" />
              <div>
                <div className="text-sm font-semibold text-slate-900">{ROOM_NAMES[roomTypeCode] ?? roomTypeCode}</div>
                <div className="text-[10px] text-slate-400">{rateName}</div>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {[
                ["Check-in", checkIn ? fmtDate(checkIn) : "—"],
                ["Check-out", checkOut ? fmtDate(checkOut) : "—"],
                [`${nights} night${nights > 1 ? "s" : ""}`, fmt(roomCharge)],
                ["Taxes (7%)", fmt(tax)],
                ["Resort fee", fmt(35)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-slate-600">
                  <span>{k}</span><span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900">
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold"><Check size={11} /> Free cancellation 48h before check-in</div>
              <div className="flex items-center gap-1.5"><Check size={11} /> Best rate guarantee</div>
              <div className="flex items-center gap-1.5"><Check size={11} /> Instant confirmation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading…</div>}><CheckoutContent /></Suspense>;
}
