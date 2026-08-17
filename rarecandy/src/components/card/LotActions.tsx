"use client";

import { Bookmark, ShoppingBag } from "lucide-react";
import type { Card, Listing } from "@/lib/types";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";

export function LotActions({ card, listing }: { card: Card; listing: Listing }) {
  const add = useStore((s) => s.addToCart);
  const toggle = useStore((s) => s.toggleWishlist);
  const saved = useStore((s) => s.wishlist.includes(card.id));
  const inBag = useStore((s) => s.cart.some((i) => i.listingId === listing.id));

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => add(listing.id, card.id)}
        className="inline-flex h-12 flex-1 items-center justify-center gap-2 bg-candy text-sm font-medium text-white hover:bg-candy-dim"
      >
        <ShoppingBag className="h-4 w-4" />
        {inBag ? "Added to bag" : `Take floor ask · ${money(listing.price)}`}
      </button>
      <button
        type="button"
        onClick={() => toggle(card.id)}
        className={`inline-flex h-12 items-center justify-center gap-2 border px-5 text-sm ${
          saved ? "border-candy text-candy" : "border-line text-bone hover:border-bone"
        }`}
      >
        <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        {saved ? "Saved" : "Watch"}
      </button>
    </div>
  );
}
