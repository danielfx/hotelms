"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, BedDouble, CalendarDays, BookMarked,
  Sparkles, Users, DollarSign, Globe, CreditCard,
  MessageCircle, Home, Settings, ChevronRight, Wrench,
  BarChart3, Heart, Building2, UsersRound, Puzzle,
  Shield, HelpCircle, Receipt, TrendingUp, Coffee
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHotelStore } from "@/store/hotel.store";

const NAV_KEYS = [
  { href: "/dashboard",              icon: LayoutDashboard, key: "dashboard" },
  { href: "/dashboard/reservations", icon: BookMarked,      key: "reservations" },
  { href: "/dashboard/checkin",      icon: CalendarDays,    key: "checkInToday" },
  { href: "/dashboard/rooms",        icon: BedDouble,       key: "rooms" },
  { href: "/dashboard/guests",       icon: Users,           key: "guests" },
  { href: "/dashboard/folio",        icon: DollarSign,      key: "folioBilling" },
  { href: "/dashboard/rates",        icon: DollarSign,      key: "ratePlans" },
  { href: "/dashboard/channels",     icon: Globe,           key: "channels" },
  { href: "/dashboard/housekeeping", icon: Sparkles,        key: "housekeeping" },
  { href: "/dashboard/room-service", icon: Coffee,          key: "roomService" },
  { href: "/dashboard/communications", icon: MessageCircle, key: "communications" },
  { href: "/dashboard/reports",      icon: BarChart3,       key: "reports" },
  { href: "/dashboard/groups",       icon: UsersRound,      key: "groupsEvents" },
  { href: "/dashboard/crm",         icon: Heart,           key: "crm" },
  { href: "/dashboard/revenue",      icon: TrendingUp,      key: "revenueIntel" },
  { href: "/dashboard/reputation",   icon: Sparkles,        key: "reputation" },
  { href: "/dashboard/portfolio",    icon: Building2,       key: "portfolio" },
  { href: "/dashboard/marketplace",  icon: Puzzle,          key: "marketplace" },
  { href: "/dashboard/audit",        icon: Shield,          key: "auditSecurity" },
  { href: "/dashboard/billing",      icon: Receipt,         key: "billing" },
  { href: "/dashboard/settings",     icon: Settings,        key: "settings" },
  { href: "/dashboard/help",        icon: HelpCircle,      key: "help" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const closeSidebar = useHotelStore((s) => s.closeSidebar);
  const sidebarOpen = useHotelStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-56 bg-[#0F172A] flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out",
        "md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="text-lg font-extrabold text-white tracking-tight">
          <span className="text-blue-400">Hotel</span>MS
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">{t("propertyManagement")}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_KEYS.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              )}>
              <Icon size={15} className={cn(active ? "text-blue-400" : "text-slate-600 group-hover:text-slate-300")} />
              <span className="text-xs">{t(key)}</span>
              {active && <ChevronRight size={10} className="ml-auto text-blue-400/50" />}
            </Link>
          );
        })}
      </nav>

      {/* Public links */}
      <div className="px-2 py-3 border-t border-white/5">
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">{t("public")}</div>
        <Link href="/book" target="_blank" onClick={closeSidebar}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
          <Globe size={13} /> {t("bookingEngine")}
        </Link>
        <Link href="/portal" target="_blank" onClick={closeSidebar}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
          <Home size={13} /> {t("guestPortal")}
        </Link>
      </div>

      {/* Property card */}
      <div className="p-3 mb-1">
        <div className="bg-[#1E293B] rounded-xl p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
              GP
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Grand Plaza Hotel</div>
              <div className="text-[10px] text-slate-500">Miami Beach, FL</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
