"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BedDouble, CalendarDays, BookMarked,
  Sparkles, Users, DollarSign, Globe, CreditCard,
  MessageCircle, Home, Settings, ChevronRight, Wrench,
  BarChart3, Heart, Building2, UsersRound, Puzzle,
  Shield, HelpCircle, Receipt, TrendingUp, Coffee
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",                   icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/reservations",      icon: BookMarked,      label: "Reservations" },
  { href: "/dashboard/checkin",           icon: CalendarDays,    label: "Check-In Today" },
  { href: "/dashboard/rooms",             icon: BedDouble,       label: "Rooms" },
  { href: "/dashboard/guests",            icon: Users,           label: "Guests" },
  { href: "/dashboard/folio",             icon: DollarSign,      label: "Folio / Billing" },
  { href: "/dashboard/rates",             icon: DollarSign,      label: "Rate Plans" },
  { href: "/dashboard/channels",          icon: Globe,           label: "Channels (OTA)" },
  { href: "/dashboard/housekeeping",      icon: Sparkles,        label: "Housekeeping" },
  { href: "/dashboard/room-service",     icon: Coffee,          label: "Room Service" },
  { href: "/dashboard/communications",    icon: MessageCircle,   label: "Communications" },
  { href: "/dashboard/reports",            icon: BarChart3,       label: "Reports" },
  { href: "/dashboard/groups",             icon: UsersRound,      label: "Groups & Events" },
  { href: "/dashboard/crm",               icon: Heart,           label: "CRM" },
  { href: "/dashboard/revenue",            icon: TrendingUp,      label: "Revenue Intel" },
  { href: "/dashboard/reputation",         icon: Sparkles,        label: "Reputation" },
  { href: "/dashboard/portfolio",          icon: Building2,       label: "Portfolio" },
  { href: "/dashboard/marketplace",        icon: Puzzle,          label: "Marketplace" },
  { href: "/dashboard/audit",              icon: Shield,          label: "Audit & Security" },
  { href: "/dashboard/billing",            icon: Receipt,         label: "Billing" },
  { href: "/dashboard/settings",           icon: Settings,        label: "Settings" },
  { href: "/dashboard/help",              icon: HelpCircle,      label: "Help" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#0F172A] flex flex-col shrink-0 min-h-screen">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="text-lg font-extrabold text-white tracking-tight">
          <span className="text-blue-400">Hotel</span>MS
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">Property Management</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              )}>
              <Icon size={15} className={cn(active ? "text-blue-400" : "text-slate-600 group-hover:text-slate-300")} />
              <span className="text-xs">{label}</span>
              {active && <ChevronRight size={10} className="ml-auto text-blue-400/50" />}
            </Link>
          );
        })}
      </nav>

      {/* Public links */}
      <div className="px-2 py-3 border-t border-white/5">
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">Public</div>
        <Link href="/book" target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
          <Globe size={13} /> Booking Engine
        </Link>
        <Link href="/portal" target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
          <Home size={13} /> Guest Portal
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
