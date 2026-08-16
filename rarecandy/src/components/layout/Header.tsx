"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search, ShoppingBag, Heart, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { useStore } from "@/lib/store";

const navLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/marketplace?sort=trending", label: "Trending" },
  { href: "/marketplace?filter=new", label: "New Arrivals" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cart, wishlist } = useStore();

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="font-display text-2xl tracking-tight">
                Rare<span className="text-accent">Candy</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "text-sm font-medium transition-colors hover:text-accent",
                    pathname === link.href.split("?")[0]
                      ? "text-ink"
                      : "text-ink-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-ink-muted hover:text-ink transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/wishlist"
              className="relative p-2 text-ink-muted hover:text-ink transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center bg-accent text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative p-2 text-ink-muted hover:text-ink transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center bg-ink text-[10px] font-bold text-cream">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-ink-muted hover:text-ink"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4 animate-fade-up">
            <form action="/marketplace" method="get" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                type="search"
                name="q"
                placeholder="Search cards, sets, or rarities..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border text-sm focus:outline-none focus:border-ink transition-colors"
              />
            </form>
          </div>
        )}
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-surface animate-fade-up">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-ink-muted hover:text-ink hover:bg-cream-dark transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
