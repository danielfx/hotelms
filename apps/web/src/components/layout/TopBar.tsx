"use client";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Plus, LogOut, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { NewReservationModal } from "@/components/reservations/NewReservationModal";
import { initials } from "@/lib/utils";
import { useHotelStore } from "@/store/hotel.store";
import api from "@/lib/api";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("topbar");
  const tn = useTranslations("nav");
  const { locale, setLocale, toggleSidebar } = useHotelStore();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const PAGE_TITLES: Record<string, string> = {
    "/dashboard":              tn("dashboard"),
    "/dashboard/rooms":        tn("rooms"),
    "/dashboard/reservations": tn("reservations"),
    "/dashboard/housekeeping": tn("housekeeping"),
    "/dashboard/room-service": tn("roomService"),
    "/dashboard/reports":      tn("reports"),
    "/dashboard/checkin":      tn("checkInToday"),
    "/dashboard/guests":       tn("guests"),
    "/dashboard/folio":        tn("folioBilling"),
    "/dashboard/rates":        tn("ratePlans"),
    "/dashboard/channels":     tn("channels"),
    "/dashboard/communications": tn("communications"),
    "/dashboard/groups":       tn("groupsEvents"),
    "/dashboard/crm":          tn("crm"),
    "/dashboard/revenue":      tn("revenueIntel"),
    "/dashboard/reputation":   tn("reputation"),
    "/dashboard/portfolio":    tn("portfolio"),
    "/dashboard/marketplace":  tn("marketplace"),
    "/dashboard/audit":        tn("auditSecurity"),
    "/dashboard/billing":      tn("billing"),
    "/dashboard/settings":     tn("settings"),
    "/dashboard/help":         tn("help"),
  };

  const title = PAGE_TITLES[pathname] ?? "HotelMS";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <>
      <header className="bg-white border-b border-slate-100 px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile) */}
          <button onClick={toggleSidebar} className="md:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <Menu size={18} className="text-slate-600" />
          </button>
          <h1 className="text-base font-bold text-slate-800">{title}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Language switcher */}
          <button
            onClick={() => setLocale(locale === "en" ? "es" : "en")}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors"
          >
            {locale === "en" ? "ES" : "EN"}
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            <span className="hidden md:inline">{t("newReservation")}</span>
          </button>
          <div className="relative" ref={notifRef}>
            <button
              onClick={async () => {
                setShowNotifications(n => !n);
                if (!showNotifications) {
                  try {
                    const data = await api.audit.searchLogs({ limit: '10' });
                    const logs = Array.isArray(data) ? data : data?.logs ?? data?.data ?? [];
                    setNotifications(logs.slice(0, 10));
                  } catch { setNotifications([]); }
                }
              }}
              className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <Bell size={15} className="text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">{t("notifications")}</span>
                  <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-400 hover:text-slate-600">{t("close")}</button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">{t("noNotifications")}</div>
                  ) : (
                    notifications.map((n: any, i: number) => (
                      <div key={i} className="px-4 py-3 hover:bg-slate-50">
                        <div className="text-xs font-semibold text-slate-700">{n.action || "Activity"}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{n.timestamp || n.createdAt || ""}</div>
                      </div>
                    ))
                  )}
                </div>
                <a href="/dashboard/audit" className="block px-4 py-2.5 text-center text-xs font-semibold text-blue-500 hover:bg-blue-50 border-t border-slate-100">
                  {t("viewAllActivity")}
                </a>
              </div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <div
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {initials("Admin User")}
            </div>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <LogOut size={14} /> {t("logOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {showModal && <NewReservationModal onClose={() => setShowModal(false)} />}
    </>
  );
}
