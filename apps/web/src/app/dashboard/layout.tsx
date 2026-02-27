"use client";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useHotelStore } from "@/store/hotel.store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, closeSidebar } = useHotelStore();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
