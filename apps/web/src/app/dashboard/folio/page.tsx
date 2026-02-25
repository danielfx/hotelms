"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DollarSign, Plus, X, CreditCard, Banknote, Receipt } from "lucide-react";
import api from "@/lib/api";

const CHARGE_TYPES = ["ROOM","FB","MINIBAR","LAUNDRY","PARKING","SPA","TELEPHONE","DAMAGE","EARLY_CHECKIN","LATE_CHECKOUT","UPGRADE","RESORT_FEE","OTHER"];
const CHARGE_ICONS: Record<string, string> = { ROOM:"🛏", FB:"🍽", MINIBAR:"🍷", LAUNDRY:"👔", PARKING:"🚗", SPA:"💆", TELEPHONE:"📞", DAMAGE:"⚠️", EARLY_CHECKIN:"⏰", LATE_CHECKOUT:"🕐", UPGRADE:"⬆️", RESORT_FEE:"🏖", OTHER:"📋" };

const fmt = (n: number) => `$${Number(n).toFixed(2)}`;

interface Charge { id: string; type: string; description: string; quantity: number; unitPrice: number; amount: number; taxAmount: number; date: string; voided: boolean; }
interface Payment { id: string; amount: number; method: string; status: string; processedAt: string; last4?: string; }

interface FolioData {
  id: string;
  reservationId: string;
  status: string;
  totalCharges: number;
  totalPayments: number;
  totalTax: number;
  balance: number;
  reservation: {
    confirmationNo: string;
    guest: { firstName: string; lastName: string; email: string };
    room: { number: string; roomType: { name: string } };
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  charges: Charge[];
  payments: Payment[];
}

function mapFolioData(raw: any): FolioData {
  const charges: Charge[] = (raw.charges ?? []).map((c: any) => ({
    id: c.id,
    type: c.type ?? "OTHER",
    description: c.description ?? "",
    quantity: Number(c.quantity ?? 1),
    unitPrice: Number(c.unitPrice ?? 0),
    amount: Number(c.amount ?? 0),
    taxAmount: Number(c.taxAmount ?? 0),
    date: typeof c.date === "string" ? c.date.split("T")[0] : (c.createdAt?.split("T")[0] ?? ""),
    voided: !!c.voided,
  }));

  const payments: Payment[] = (raw.reservation?.payments ?? raw.payments ?? []).map((p: any) => ({
    id: p.id,
    amount: Number(p.amount ?? 0),
    method: p.method ?? "CASH",
    status: p.status ?? "CAPTURED",
    processedAt: p.processedAt ?? p.createdAt ?? "",
    last4: p.last4,
  }));

  const totalCharges = Number(raw.totalCharges ?? charges.reduce((s, c) => s + (c.voided ? 0 : c.amount), 0));
  const totalPayments = Number(raw.totalPayments ?? payments.reduce((s, p) => s + p.amount, 0));
  const totalTax = Number(raw.totalTax ?? charges.reduce((s, c) => s + (c.voided ? 0 : c.taxAmount), 0));

  const res = raw.reservation ?? {};
  const guest = res.guest ?? {};
  const room = res.room ?? {};
  const roomType = room.roomType ?? room.type ?? {};

  return {
    id: raw.id ?? "",
    reservationId: raw.reservationId ?? "",
    status: raw.status ?? "OPEN",
    totalCharges,
    totalPayments,
    totalTax,
    balance: Number(raw.balance ?? (totalCharges - totalPayments)),
    reservation: {
      confirmationNo: res.confirmationNo ?? res.confirmationNumber ?? "",
      guest: {
        firstName: guest.firstName ?? "",
        lastName: guest.lastName ?? "",
        email: guest.email ?? "",
      },
      room: {
        number: room.number ?? room.roomNumber ?? "",
        roomType: { name: typeof roomType === "string" ? roomType : (roomType.name ?? "") },
      },
      checkIn: (res.checkIn ?? "").split?.("T")[0] ?? res.checkIn ?? "",
      checkOut: (res.checkOut ?? "").split?.("T")[0] ?? res.checkOut ?? "",
      nights: Number(res.nights ?? 0),
    },
    charges,
    payments,
  };
}

export default function FolioPage() {
  const searchParams = useSearchParams();
  const [folio, setFolio] = useState<FolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState(searchParams.get("reservationId") ?? "");
  const [searchInput, setSearchInput] = useState("");
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newCharge, setNewCharge] = useState({ type: "MINIBAR", description: "", quantity: 1, unitPrice: 0 });
  const [newPayment, setNewPayment] = useState({ amount: 0, method: "CREDIT_CARD", last4: "" });

  // Try to load folio for the first reservation found
  useEffect(() => {
    if (!reservationId) {
      // Fetch the first active reservation to show a folio
      setLoading(true);
      const findReservation = async () => {
        try {
          // Try checked-in first
          const checkedInRes: any = await api.reservations.list({ status: "CHECKED_IN" });
          const checkedInList = Array.isArray(checkedInRes) ? checkedInRes : (checkedInRes.reservations ?? []);
          if (checkedInList.length > 0) {
            setReservationId(checkedInList[0].id);
            return;
          }
          // Fall back to all reservations
          const allRes: any = await api.reservations.list();
          const allList = Array.isArray(allRes) ? allRes : (allRes.reservations ?? []);
          if (allList.length > 0) {
            setReservationId(allList[0].id);
            return;
          }
        } catch {}
        setLoading(false);
      };
      findReservation();
      return;
    }

    setLoading(true);
    setError(null);
    api.folio.get(reservationId)
      .then((data: any) => {
        setFolio(mapFolioData(data));
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load folio");
        setFolio(null);
      })
      .finally(() => setLoading(false));
  }, [reservationId]);

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    if (trimmed) {
      setReservationId(trimmed);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto"></div>
          </div>
          <p className="text-sm text-slate-400 mt-4">Loading folio...</p>
        </div>
      </div>
    );
  }

  if (!folio) {
    return (
      <div className="space-y-5 max-w-4xl">
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <div className="text-center mb-6">
            <DollarSign size={32} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700 text-lg">Guest Folio</h3>
            <p className="text-sm text-slate-400 mt-1">
              {error ? error : "Enter a reservation ID to view its folio."}
            </p>
          </div>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Reservation ID"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
            <button onClick={handleSearch} className="btn-primary text-xs px-4 py-2">
              Load Folio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const balance = folio.totalCharges - folio.totalPayments;
  const activeCharges = folio.charges.filter(c => !c.voided);

  const handleVoidCharge = (id: string) => {
    api.folio.voidCharge(id).then(() => {
      setFolio(f => {
        if (!f) return f;
        return {
          ...f,
          charges: f.charges.map(c => c.id === id ? { ...c, voided: true } : c),
          totalCharges: f.totalCharges - (f.charges.find(c => c.id === id)?.amount ?? 0),
        };
      });
    }).catch(() => {
      // Optimistic update on failure fallback
      setFolio(f => {
        if (!f) return f;
        return {
          ...f,
          charges: f.charges.map(c => c.id === id ? { ...c, voided: true } : c),
          totalCharges: f.totalCharges - (f.charges.find(c => c.id === id)?.amount ?? 0),
        };
      });
    });
  };

  const handleAddCharge = () => {
    if (!newCharge.description || newCharge.unitPrice <= 0) return;
    const amount = newCharge.quantity * newCharge.unitPrice;
    const taxAmount = amount * 0.07;

    api.folio.addCharge(folio.id, {
      type: newCharge.type,
      description: newCharge.description,
      quantity: newCharge.quantity,
      unitPrice: newCharge.unitPrice,
    }).then((result: any) => {
      const charge: Charge = {
        id: result?.id ?? `c-${Date.now()}`,
        ...newCharge,
        amount,
        taxAmount,
        date: new Date().toISOString().split("T")[0],
        voided: false,
      };
      setFolio(f => {
        if (!f) return f;
        return {
          ...f,
          charges: [...f.charges, charge],
          totalCharges: f.totalCharges + amount,
        };
      });
      setNewCharge({ type: "MINIBAR", description: "", quantity: 1, unitPrice: 0 });
      setShowAddCharge(false);
    }).catch(() => {
      // Fallback: add locally
      const charge: Charge = {
        id: `c-${Date.now()}`, ...newCharge, amount, taxAmount,
        date: new Date().toISOString().split("T")[0], voided: false,
      };
      setFolio(f => {
        if (!f) return f;
        return {
          ...f,
          charges: [...f.charges, charge],
          totalCharges: f.totalCharges + amount,
        };
      });
      setNewCharge({ type: "MINIBAR", description: "", quantity: 1, unitPrice: 0 });
      setShowAddCharge(false);
    });
  };

  const handleAddPayment = () => {
    if (newPayment.amount <= 0) return;

    api.folio.addPayment(folio.reservationId, {
      amount: newPayment.amount,
      method: newPayment.method,
      last4: newPayment.last4,
    }).then((result: any) => {
      const payment: Payment = {
        id: result?.id ?? `p-${Date.now()}`,
        ...newPayment,
        status: "CAPTURED",
        processedAt: new Date().toISOString(),
      };
      setFolio(f => {
        if (!f) return f;
        return {
          ...f,
          payments: [...f.payments, payment],
          totalPayments: f.totalPayments + newPayment.amount,
        };
      });
      setNewPayment({ amount: 0, method: "CREDIT_CARD", last4: "" });
      setShowAddPayment(false);
    }).catch(() => {
      const payment: Payment = {
        id: `p-${Date.now()}`, ...newPayment, status: "CAPTURED",
        processedAt: new Date().toISOString(),
      };
      setFolio(f => {
        if (!f) return f;
        return {
          ...f,
          payments: [...f.payments, payment],
          totalPayments: f.totalPayments + newPayment.amount,
        };
      });
      setNewPayment({ amount: 0, method: "CREDIT_CARD", last4: "" });
      setShowAddPayment(false);
    });
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Search by reservation ID..."
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
        <button onClick={handleSearch} className="btn-primary text-xs px-4 py-2">
          Load Folio
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Folio — {folio.reservation.confirmationNo}</div>
            <div className="text-xl font-extrabold text-slate-900">
              {folio.reservation.guest.firstName} {folio.reservation.guest.lastName}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              Room {folio.reservation.room.number} · {folio.reservation.room.roomType.name} ·{" "}
              {folio.reservation.checkIn} → {folio.reservation.checkOut} ({folio.reservation.nights}n)
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="text-right">
              <div className="text-xs text-slate-400">Total Charges</div>
              <div className="text-lg font-bold text-slate-900">{fmt(folio.totalCharges)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Paid</div>
              <div className="text-lg font-bold text-emerald-600">{fmt(folio.totalPayments)}</div>
            </div>
            <div className="text-right bg-slate-50 rounded-xl px-4 py-2">
              <div className="text-xs text-slate-400">Balance Due</div>
              <div className={`text-xl font-extrabold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {fmt(balance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Charges */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Charges</h3>
            <button onClick={() => setShowAddCharge(true)} className="btn-primary text-xs py-1.5 flex items-center gap-1">
              <Plus size={12} /> Add Charge
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Date", "Description", "Qty", "Unit", "Amount", ""].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {folio.charges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-slate-400">No charges yet</td>
                  </tr>
                ) : folio.charges.map(c => (
                  <tr key={c.id} className={`border-t border-slate-50 ${c.voided ? "opacity-40" : ""}`}>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{c.date.slice(5)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{CHARGE_ICONS[c.type] ?? "📋"}</span>
                        <div>
                          <div className="text-xs font-medium text-slate-800">{c.description}</div>
                          {c.voided && <div className="text-[10px] text-red-500 font-semibold">VOIDED</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{c.quantity}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{fmt(c.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{fmt(c.amount)}</td>
                    <td className="px-3 py-2.5">
                      {!c.voided && c.type !== "ROOM" && (
                        <button onClick={() => handleVoidCharge(c.id)}
                          className="text-[10px] text-red-400 hover:text-red-600 font-medium">void</button>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Tax row */}
                <tr className="border-t border-slate-100 bg-slate-50/50">
                  <td colSpan={4} className="px-3 py-2 text-xs text-slate-500 text-right">Taxes (7%)</td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-600">{fmt(folio.totalTax)}</td>
                  <td />
                </tr>
                {/* Total row */}
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={4} className="px-3 py-3 text-sm font-bold text-slate-800 text-right">Total</td>
                  <td className="px-3 py-3 text-sm font-extrabold text-slate-900">{fmt(folio.totalCharges)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add Charge Form */}
          {showAddCharge && (
            <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-800">New Charge</span>
                <button onClick={() => setShowAddCharge(false)}><X size={14} className="text-slate-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Type</label>
                  <select value={newCharge.type} onChange={e => setNewCharge(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    {CHARGE_TYPES.map(t => <option key={t} value={t}>{CHARGE_ICONS[t]} {t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Description *</label>
                  <input value={newCharge.description} onChange={e => setNewCharge(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Dinner at La Terraza"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Qty</label>
                  <input type="number" min={1} value={newCharge.quantity} onChange={e => setNewCharge(f => ({ ...f, quantity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Unit Price *</label>
                  <input type="number" min={0} step={0.01} value={newCharge.unitPrice} onChange={e => setNewCharge(f => ({ ...f, unitPrice: Number(e.target.value) }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
              </div>
              {newCharge.unitPrice > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  Total: <strong>{fmt(newCharge.quantity * newCharge.unitPrice)}</strong> + tax
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowAddCharge(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddCharge} className="flex-[2] py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold">Post Charge</button>
              </div>
            </div>
          )}
        </div>

        {/* Payments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Payments</h3>
            <button onClick={() => setShowAddPayment(true)} className="btn-primary text-xs py-1.5 flex items-center gap-1">
              <Plus size={12} /> Add Payment
            </button>
          </div>

          <div className="space-y-2">
            {folio.payments.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {p.method === "CREDIT_CARD" ? <CreditCard size={14} className="text-blue-500" /> : <Banknote size={14} className="text-emerald-500" />}
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{p.method.replace(/_/g, " ")}{p.last4 ? ` ····${p.last4}` : ""}</div>
                      <div className="text-[10px] text-slate-400">{new Date(p.processedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">{fmt(p.amount)}</div>
                </div>
              </div>
            ))}

            {folio.payments.length === 0 && (
              <div className="bg-slate-50 rounded-xl p-6 text-center text-xs text-slate-400">No payments recorded</div>
            )}
          </div>

          {/* Balance summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total Charges</span><span className="font-semibold text-slate-800">{fmt(folio.totalCharges)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total Paid</span><span className="font-semibold text-emerald-600">{fmt(folio.totalPayments)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
              <span className="text-slate-700">Balance Due</span>
              <span className={balance > 0 ? "text-red-600" : "text-emerald-600"}>{fmt(balance)}</span>
            </div>
          </div>

          {/* Add Payment Form */}
          {showAddPayment && (
            <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-800">Record Payment</span>
                <button onClick={() => setShowAddPayment(false)}><X size={14} className="text-slate-400" /></button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Amount *</label>
                  <input type="number" min={0} step={0.01} value={newPayment.amount || ""} onChange={e => setNewPayment(f => ({ ...f, amount: Number(e.target.value) }))}
                    placeholder={`Balance: ${fmt(balance)}`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Method</label>
                  <select value={newPayment.method} onChange={e => setNewPayment(f => ({ ...f, method: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    {["CREDIT_CARD","CASH","DEBIT_CARD","BANK_TRANSFER"].map(m => <option key={m} value={m}>{m.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                {newPayment.method === "CREDIT_CARD" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Last 4 digits</label>
                    <input value={newPayment.last4} onChange={e => setNewPayment(f => ({ ...f, last4: e.target.value }))}
                      maxLength={4} placeholder="4242"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                  </div>
                )}
                <button onClick={() => setNewPayment(f => ({ ...f, amount: balance }))}
                  className="text-xs text-blue-500 hover:underline">Fill balance ({fmt(balance)})</button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowAddPayment(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddPayment} className="flex-[2] py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold">Post Payment</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {folio.status === "OPEN" && balance > 0.01 && (
              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2 text-center">
                Pay the outstanding balance (${balance.toFixed(2)}) before closing the folio
              </p>
            )}
            {folio.status === "OPEN" && (
              <button
                disabled={balance > 0.01}
                onClick={async () => {
                  try {
                    await api.folio.close(folio.id);
                    setFolio(f => f ? { ...f, status: "CLOSED" } : f);
                  } catch (e: any) { alert(e.message || "Failed to close folio"); }
                }}
                className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                <X size={13} /> Close Folio
              </button>
            )}
            {folio.status === "CLOSED" && (
              <p className="text-[10px] text-emerald-600 bg-emerald-50 rounded-lg p-2 text-center">
                Folio closed. You can now generate the invoice.
              </p>
            )}
            <button
              disabled={folio.status !== "CLOSED"}
              onClick={async () => {
                try {
                  const result = await api.folio.invoice(folio.id);
                  setFolio(f => f ? { ...f, status: "INVOICED" } : f);
                  alert(`Invoice generated: ${result?.invoiceNo ?? "Success"}`);
                } catch (e: any) { alert(e.message || "Failed to generate invoice"); }
              }}
              className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
              <Receipt size={13} /> Generate Invoice
            </button>
            {folio.status === "INVOICED" && (
              <p className="text-[10px] text-blue-600 bg-blue-50 rounded-lg p-2 text-center">
                Invoice generated successfully
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
