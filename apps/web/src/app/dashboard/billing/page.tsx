"use client";
import { useState, useEffect } from "react";
import { CreditCard, Receipt, Check, Zap, Users, BedDouble, Calendar, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export default function BillingPage() {
  const [tab, setTab] = useState<"subscription" | "invoices" | "usage">("subscription");
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [plansRes, subRes, invRes, usageRes] = await Promise.all([
          api.billing.plans().catch(() => []),
          api.billing.getSubscription().catch(() => null),
          api.billing.invoices().catch(() => []),
          api.billing.usage().catch(() => null),
        ]);
        setPlans(Array.isArray(plansRes) ? plansRes : []);
        setSubscription(subRes);
        setInvoices(Array.isArray(invRes) ? invRes : []);
        setUsage(usageRes);
      } catch {
        // fallback to empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your plan, invoices, and usage</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const subPlanName = subscription?.planName || subscription?.plan?.name || "";
  const subPrice = subscription ? Number(subscription.price ?? subscription.plan?.price ?? 0) : 0;
  const subInterval = subscription?.interval || subscription?.plan?.interval || "month";
  const subRenews = subscription?.currentPeriodEnd || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your plan, invoices, and usage</p>
      </div>

      {/* Current Plan Banner */}
      {subscription ? (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-200">Current Plan</div>
              <div className="text-2xl font-bold mt-1">{subPlanName}</div>
              <div className="text-sm text-blue-200 mt-1">${subPrice.toFixed(2)}/{subInterval} {subRenews ? <>&#183; Renews {new Date(subRenews).toLocaleDateString()}</> : ""}</div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">Change Plan</button>
              <button className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">Manage Billing</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-300">Current Plan</div>
              <div className="text-2xl font-bold mt-1">No active subscription</div>
              <div className="text-sm text-slate-300 mt-1">Choose a plan below to get started</div>
            </div>
            <button className="px-4 py-2 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Choose Plan</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["subscription", "invoices", "usage"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "subscription" && (
        plans.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <CreditCard size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No plans available</h3>
            <p className="text-sm text-slate-500">Subscription plans will appear here once configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {plans.map((plan: any) => {
              const planPrice = Number(plan.price ?? 0);
              const planInterval = plan.interval || "month";
              const isCurrentPlan = subPlanName && plan.name === subPlanName;
              return (
                <div key={plan.id} className={`bg-white rounded-xl border-2 p-6 ${plan.recommended ? "border-blue-500 shadow-lg" : "border-slate-200"} relative`}>
                  {plan.recommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">Recommended</div>}
                  <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-slate-900">${planPrice.toFixed(2)}</span>
                    <span className="text-slate-500">/{planInterval}</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {(Array.isArray(plan.features) ? plan.features : []).map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check size={14} className="text-green-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full mt-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCurrentPlan ? "bg-slate-100 text-slate-500 cursor-default" : plan.recommended ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                    {isCurrentPlan ? "Current Plan" : "Switch to " + plan.name}
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "invoices" && (
        <div className="bg-white rounded-xl border border-slate-200">
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 mb-1">No invoices yet</h3>
              <p className="text-sm text-slate-500">Invoices will appear here after your first billing cycle.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                  <th className="p-4 font-medium">Invoice</th>
                  <th className="p-4 font-medium">Period</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                    <td className="p-4 font-medium text-slate-900">{inv.number || inv.invoiceNumber || inv.id}</td>
                    <td className="p-4 text-slate-600">{inv.period || "-"}</td>
                    <td className="p-4 text-right font-medium text-slate-900">${Number(inv.amount ?? 0).toFixed(2)}</td>
                    <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{inv.status || "PENDING"}</span></td>
                    <td className="p-4 text-sm text-slate-500">{inv.date || (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "usage" && (
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: "Rooms", value: Number(usage?.rooms ?? 0), limit: Number(usage?.roomsLimit ?? 100), icon: BedDouble },
            { label: "Reservations", value: Number(usage?.reservations ?? 0), limit: Number(usage?.reservationsLimit ?? 5000), icon: Calendar },
            { label: "Guests", value: Number(usage?.guests ?? 0), limit: Number(usage?.guestsLimit ?? 10000), icon: Users },
            { label: "Active Users", value: Number(usage?.activeUsers ?? 0), limit: Number(usage?.activeUsersLimit ?? usage?.usersLimit ?? 5), icon: Zap },
          ].map(u => {
            const pct = u.limit > 0 ? Math.min((u.value / u.limit) * 100, 100) : 0;
            return (
              <div key={u.label} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <u.icon size={20} className="text-slate-400" />
                    <h3 className="font-semibold text-slate-900">{u.label}</h3>
                  </div>
                  <span className="text-sm text-slate-500">{u.value} / {u.limit.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">{Math.round(pct)}% of plan limit</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
