"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Download, Mail, Calendar, BedDouble, Phone } from "lucide-react";

const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric"
});

function ConfirmationContent() {
  const params = useSearchParams();
  const confirmNo = params.get("no") ?? "RES-0000";
  const email = params.get("email") ?? "";
  const total = Number(params.get("total") ?? 0);
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const room = params.get("room") ?? "Room";

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full space-y-6">
        {/* Success icon */}
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Booking Confirmed!</h1>
          <p className="text-slate-500 mt-2">A confirmation has been sent to <strong>{email}</strong></p>
        </div>

        {/* Confirmation card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Confirmation number */}
          <div className="bg-emerald-500 p-6 text-center text-white">
            <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Confirmation Number</div>
            <div className="text-4xl font-black tracking-wider">{confirmNo}</div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Calendar size={15} />, label: "Check-in", value: checkIn ? fmtDate(checkIn) : "—" },
                { icon: <Calendar size={15} />, label: "Check-out", value: checkOut ? fmtDate(checkOut) : "—" },
                { icon: <BedDouble size={15} />, label: "Room", value: room },
                { icon: <BedDouble size={15} />, label: "Duration", value: `${nights} night${nights > 1 ? "s" : ""}` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {icon}{label}
                  </div>
                  <div className="text-sm font-bold text-slate-900">{value}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Paid</span>
              <span className="text-xl font-extrabold text-slate-900">${total.toFixed(2)}</span>
            </div>

            {/* Hotel contact */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-widest">Grand Plaza Hotel & Spa</div>
              <div className="text-xs text-blue-600 flex items-center gap-1.5"><Phone size={11} /> +1 (305) 555-0100</div>
              <div className="text-xs text-blue-600">1234 Ocean Drive, Miami Beach, FL</div>
              <div className="text-xs text-blue-500">Check-in from 15:00 · Check-out until 11:00</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex border-t border-slate-100">
            <button onClick={() => alert("Confirmation email has been resent to your inbox.")} className="flex-1 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Mail size={14} /> Resend Email
            </button>
            <div className="w-px bg-slate-100" />
            <button onClick={() => { window.print(); }} className="flex-1 py-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-3">What happens next?</h3>
          <div className="space-y-2">
            {[
              "Confirmation email sent to your inbox",
              "Hotel will contact you if there are special arrangements",
              "Check in at the front desk from 15:00 on arrival day",
              "Bring your confirmation number and a valid ID",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-500">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Need to modify or cancel?{" "}
          <a href="/portal" className="text-blue-600 underline">
            Manage your booking
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-emerald-50 flex items-center justify-center text-slate-400">Loading…</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
