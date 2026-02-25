"use client";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Plus, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { NewReservationModal } from "@/components/reservations/NewReservationModal";
import { initials } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":              "Dashboard",
  "/dashboard/rooms":        "Rooms",
  "/dashboard/calendar":     "Calendar",
  "/dashboard/reservations": "Reservations",
  "/dashboard/housekeeping": "Housekeeping",
  "/dashboard/room-service": "Room Service",
  "/dashboard/reports":      "Reports",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const title = PAGE_TITLES[pathname] ?? "HotelMS";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
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
      <header className="bg-white border-b border-slate-100 px-6 lg:px-8 h-14 flex items-center justify-between shrink-0">
        <h1 className="text-base font-bold text-slate-800">{title}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            New Reservation
          </button>
          <button className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <Bell size={15} className="text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
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
                  <LogOut size={14} /> Log out
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
