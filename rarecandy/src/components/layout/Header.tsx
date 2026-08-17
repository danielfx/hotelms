"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useStore } from "@/lib/store";

const links = [
  { href: "/shop", label: "Floor" },
  { href: "/editions", label: "Editions" },
  { href: "/shop?board=movers", label: "Tape" },
  { href: "/shop?ink=fresh", label: "Fresh ink" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const bag = useStore((s) => s.cart.reduce((n, i) => n + i.quantity, 0));
  const saved = useStore((s) => s.wishlist.length);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  function go(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-[1400px] items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-8 w-5 place-items-center rounded-[9px] bg-candy text-[10px] font-bold text-white shadow-[0_0_18px_rgba(255,47,109,0.45)]">
            ●
          </span>
          <span className="display text-[1.15rem] font-semibold uppercase tracking-[0.14em]">
            RareCandy
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-fog sm:inline">
            After Dark
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-[13px] text-fog md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-bone ${pathname === l.href ? "text-bone" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={go} className="ml-auto hidden max-w-sm flex-1 lg:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Call a name — Charizard, Umbreon, Lugia"
              className="h-10 w-full border border-line bg-stage pl-10 pr-3 text-sm text-bone outline-none placeholder:text-fog/70 focus:border-candy"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link href="/shop" className="grid h-10 w-10 place-items-center text-fog hover:text-bone lg:hidden">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/saved" className="relative grid h-10 w-10 place-items-center text-fog hover:text-bone">
            <Bookmark className="h-5 w-5" />
            {saved > 0 && (
              <span className="absolute right-1 top-1 h-4 min-w-4 rounded-full bg-candy px-1 text-center text-[10px] leading-4 text-white">
                {saved}
              </span>
            )}
          </Link>
          <Link href="/bag" className="relative grid h-10 w-10 place-items-center text-fog hover:text-bone">
            <ShoppingBag className="h-5 w-5" />
            {bag > 0 && (
              <span className="absolute right-1 top-1 h-4 min-w-4 rounded-full bg-bone px-1 text-center text-[10px] leading-4 text-void">
                {bag}
              </span>
            )}
          </Link>
          <button type="button" className="grid h-10 w-10 place-items-center md:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-stage px-4 py-4 md:hidden">
          <form onSubmit={go}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the floor"
              className="mb-3 h-11 w-full border border-line bg-void px-3 text-sm"
            />
          </form>
          <div className="grid gap-3 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
