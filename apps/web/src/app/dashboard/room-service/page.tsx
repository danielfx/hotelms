"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Coffee, Clock, DollarSign, ChefHat, Plus, X, Minus,
  Check, Truck, Ban, RefreshCw, ShoppingCart, AlertCircle
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "orders" | "menu" | "new-order";
type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERING" | "DELIVERED" | "CANCELLED";
type MenuCategory = "BREAKFAST" | "APPETIZER" | "MAIN_COURSE" | "DESSERT" | "BEVERAGE" | "SNACK" | "COMBO";

interface MenuItem {
  id: string; name: string; category: MenuCategory; description?: string;
  price: number; isAvailable: boolean; prepTime: number; allergens: string[];
  image?: string; sortOrder: number;
}

interface OrderItem {
  id: string; menuItemId: string; quantity: number; unitPrice: number;
  subtotal: number; notes?: string; menuItem: MenuItem;
}

interface Order {
  id: string; status: OrderStatus; totalAmount: number; taxAmount: number;
  specialInstructions?: string; estimatedDelivery?: string;
  createdAt: string; confirmedAt?: string; deliveredAt?: string;
  cancelReason?: string;
  guest: { firstName: string; lastName: string };
  room: { number: string; roomType?: { name: string } };
  items: OrderItem[];
}

interface Stats {
  activeOrders: number; todayRevenue: number; avgDeliveryTime: number;
  itemsServed: number; statusBreakdown: Record<string, number>;
  popularItems: { menuItemId: string; name: string; quantity: number }[];
}

// ─── Config ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Pending",    color: "#F59E0B", bg: "#FFFBEB" },
  CONFIRMED:  { label: "Confirmed",  color: "#3B82F6", bg: "#EFF6FF" },
  PREPARING:  { label: "Preparing",  color: "#8B5CF6", bg: "#F5F3FF" },
  READY:      { label: "Ready",      color: "#10B981", bg: "#ECFDF5" },
  DELIVERING: { label: "Delivering", color: "#0EA5E9", bg: "#F0F9FF" },
  DELIVERED:  { label: "Delivered",  color: "#6B7280", bg: "#F9FAFB" },
  CANCELLED:  { label: "Cancelled",  color: "#EF4444", bg: "#FEF2F2" },
};

const CATEGORY_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast", APPETIZER: "Appetizer", MAIN_COURSE: "Main Course",
  DESSERT: "Dessert", BEVERAGE: "Beverage", SNACK: "Snack", COMBO: "Combo",
};

const STATUS_ACTIONS: Record<string, { next: string; label: string; icon: any }> = {
  PENDING:    { next: "CONFIRMED",  label: "Confirm",          icon: Check },
  CONFIRMED:  { next: "PREPARING",  label: "Start Preparing",  icon: ChefHat },
  PREPARING:  { next: "READY",      label: "Mark Ready",       icon: Check },
  READY:      { next: "DELIVERING", label: "Out for Delivery",  icon: Truck },
  DELIVERING: { next: "DELIVERED",  label: "Delivered",         icon: Check },
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RoomServicePage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Orders tab state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Menu tab state
  const [menuCategory, setMenuCategory] = useState<string>("all");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // New Order tab state
  const [selectedReservation, setSelectedReservation] = useState<string>("");
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── Data Loading ──────────────────────────────────────────────────────────

  const loadOrders = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await api.roomService.listOrders(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message); }
  }, [statusFilter]);

  const loadMenu = useCallback(async () => {
    try {
      const data = await api.roomService.listMenu();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.roomService.stats();
      setStats(data);
    } catch {}
  }, []);

  const loadOccupiedRooms = useCallback(async () => {
    try {
      const res = await api.reservations.list({ status: "CHECKED_IN" });
      const list = Array.isArray(res) ? res : res?.reservations ?? res?.data ?? [];
      setOccupiedRooms(list);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([loadOrders(), loadMenu(), loadStats(), loadOccupiedRooms()])
      .finally(() => setLoading(false));
  }, [loadOrders, loadMenu, loadStats, loadOccupiedRooms]);

  // Auto-refresh orders every 30s
  useEffect(() => {
    if (tab !== "orders") return;
    const interval = setInterval(() => { loadOrders(); loadStats(); }, 30000);
    return () => clearInterval(interval);
  }, [tab, loadOrders, loadStats]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.roomService.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      await loadStats();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await api.roomService.toggleAvailability(id);
      await loadMenu();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await api.roomService.deleteMenuItem(id);
      await loadMenu();
    } catch (e: any) { alert(e.message); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedReservation || Object.keys(cart).length === 0) return;
    setSubmitting(true);
    try {
      const items = Object.entries(cart).filter(([, qty]) => qty > 0).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
      await api.roomService.createOrder({
        reservationId: selectedReservation,
        items,
        specialInstructions: orderNotes || undefined,
      });
      setCart({});
      setOrderNotes("");
      setSelectedReservation("");
      setTab("orders");
      await loadOrders();
      await loadStats();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  const addToCart = (id: string, delta: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: next };
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => m.id === id);
    return sum + (item ? Number(item.price) * qty : 0);
  }, 0);

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // ─── Elapsed time helper ───────────────────────────────────────────────────

  const elapsed = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin text-slate-400" size={24} />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([
          { key: "orders", label: "Orders", icon: Coffee },
          { key: "menu", label: "Menu", icon: ChefHat },
          { key: "new-order", label: "New Order", icon: ShoppingCart },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <t.icon size={15} /> {t.label}
            {t.key === "new-order" && cartItemCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartItemCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ ORDERS TAB ═══ */}
      {tab === "orders" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Active Orders", value: stats.activeOrders, icon: Coffee, color: "blue" },
                { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, icon: DollarSign, color: "green" },
                { label: "Avg Delivery", value: stats.avgDeliveryTime > 0 ? `${stats.avgDeliveryTime}m` : "N/A", icon: Clock, color: "amber" },
                { label: "Orders Today", value: stats.itemsServed, icon: ChefHat, color: "purple" },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                    <div className={`w-8 h-8 rounded-lg bg-${kpi.color}-50 flex items-center justify-center`}>
                      <kpi.icon size={15} className={`text-${kpi.color}-500`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERING", "DELIVERED"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === s
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                {s === "all" ? "All" : STATUS_CFG[s as OrderStatus]?.label ?? s}
              </button>
            ))}
            <button onClick={() => { loadOrders(); loadStats(); }}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {/* Order cards */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <Coffee size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const cfg = STATUS_CFG[order.status];
                const action = STATUS_ACTIONS[order.status];
                const isExpanded = expandedOrder === order.id;

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {/* Order header */}
                    <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800">Room {order.room.number}</span>
                          <span className="text-xs text-slate-400">|</span>
                          <span className="text-sm text-slate-600">{order.guest.firstName} {order.guest.lastName}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""} &middot; {elapsed(order.createdAt)} ago
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800">${Number(order.totalAmount).toFixed(2)}</div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-100">
                        <div className="pt-4 space-y-3">
                          {/* Items list */}
                          <div className="space-y-2">
                            {order.items.map(item => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="font-medium text-slate-700">{item.quantity}x</span>{" "}
                                  <span className="text-slate-600">{item.menuItem.name}</span>
                                  {item.notes && <span className="text-xs text-slate-400 ml-2">({item.notes})</span>}
                                </div>
                                <span className="text-slate-500">${Number(item.subtotal).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {order.specialInstructions && (
                            <div className="text-xs text-slate-500 bg-amber-50 rounded-lg p-3">
                              <strong>Notes:</strong> {order.specialInstructions}
                            </div>
                          )}

                          {order.estimatedDelivery && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                            <div className="text-xs text-slate-400">
                              Est. delivery: {new Date(order.estimatedDelivery).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            {action && (
                              <button onClick={() => handleStatusChange(order.id, action.next)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors">
                                <action.icon size={13} /> {action.label}
                              </button>
                            )}
                            {["PENDING", "CONFIRMED", "PREPARING"].includes(order.status) && (
                              <button onClick={() => handleStatusChange(order.id, "CANCELLED")}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
                                <Ban size={13} /> Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ MENU TAB ═══ */}
      {tab === "menu" && (
        <div className="space-y-6">
          {/* Category tabs + Add button */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {["all", "BREAKFAST", "APPETIZER", "MAIN_COURSE", "DESSERT", "BEVERAGE", "SNACK"].map(cat => (
                <button key={cat} onClick={() => setMenuCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    menuCategory === cat
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                  {cat === "all" ? "All" : CATEGORY_LABELS[cat] ?? cat}
                </button>
              ))}
            </div>
            <button onClick={() => { setEditingItem(null); setShowMenuModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors">
              <Plus size={13} /> Add Item
            </button>
          </div>

          {/* Menu grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems
              .filter(m => menuCategory === "all" || m.category === menuCategory)
              .map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{item.name}</h3>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 mt-1">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-slate-800">${Number(item.price).toFixed(2)}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {item.prepTime}m</span>
                      {item.allergens.length > 0 && (
                        <span className="text-[10px]">{item.allergens.join(", ")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Availability toggle */}
                      <button onClick={() => handleToggleAvailability(item.id)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          item.isAvailable ? "bg-green-500" : "bg-slate-300"
                        }`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          item.isAvailable ? "left-[18px]" : "left-0.5"
                        }`} />
                      </button>
                      <button onClick={() => { setEditingItem(item); setShowMenuModal(true); }}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                      <button onClick={() => handleDeleteMenuItem(item.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ═══ NEW ORDER TAB ═══ */}
      {tab === "new-order" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Menu items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room selector */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Room</label>
              <select value={selectedReservation} onChange={e => setSelectedReservation(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">-- Select an occupied room --</option>
                {occupiedRooms.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    Room {r.room?.number ?? r.roomNumber ?? "?"} &mdash; {r.guest?.firstName ?? ""} {r.guest?.lastName ?? ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Menu items by category */}
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const items = menuItems.filter(m => m.category === cat && m.isAvailable);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">{label}</h3>
                  <div className="space-y-2">
                    {items.map(item => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div key={item.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-slate-700">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-slate-400 truncate">{item.description}</div>
                            )}
                          </div>
                          <div className="text-sm font-bold text-slate-700 w-16 text-right">${Number(item.price).toFixed(2)}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => addToCart(item.id, -1)} disabled={qty === 0}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center disabled:opacity-30 transition-colors">
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-slate-700">{qty}</span>
                            <button onClick={() => addToCart(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Cart sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingCart size={16} /> Order Summary
              </h3>

              {Object.keys(cart).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No items added yet</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = menuItems.find(m => m.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{qty}x {item.name}</span>
                        <span className="font-medium text-slate-700">${(Number(item.price) * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Tax (est.)</span>
                  <span className="font-medium">${(cartTotal * 0.07).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 mt-2">
                  <span>Total</span>
                  <span>${(cartTotal * 1.07).toFixed(2)}</span>
                </div>
              </div>

              <textarea
                placeholder="Special instructions..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={3}
              />

              <button onClick={handlePlaceOrder}
                disabled={submitting || !selectedReservation || Object.keys(cart).length === 0}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Coffee size={14} />}
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MENU ITEM MODAL ═══ */}
      {showMenuModal && (
        <MenuItemModal
          item={editingItem}
          onClose={() => { setShowMenuModal(false); setEditingItem(null); }}
          onSaved={() => { setShowMenuModal(false); setEditingItem(null); loadMenu(); }}
        />
      )}
    </div>
  );
}

// ─── Menu Item Modal Component ──────────────────────────────────────────────

function MenuItemModal({ item, onClose, onSaved }: {
  item: MenuItem | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    category: item?.category ?? "MAIN_COURSE",
    description: item?.description ?? "",
    price: item?.price?.toString() ?? "",
    prepTime: item?.prepTime?.toString() ?? "15",
    allergens: item?.allergens?.join(", ") ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: form.name,
        category: form.category,
        description: form.description || undefined,
        price: parseFloat(form.price),
        prepTime: parseInt(form.prepTime) || 15,
        allergens: form.allergens ? form.allergens.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      if (item) {
        await api.roomService.updateMenuItem(item.id, data);
      } else {
        await api.roomService.createMenuItem(data);
      }
      onSaved();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{item ? "Edit Menu Item" : "Add Menu Item"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Price ($)</label>
              <input type="number" step="0.01" min="0" required value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Prep Time (min)</label>
              <input type="number" min="1" value={form.prepTime} onChange={e => setForm({ ...form, prepTime: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Allergens</label>
              <input type="text" placeholder="gluten, dairy..." value={form.allergens}
                onChange={e => setForm({ ...form, allergens: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : item ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
