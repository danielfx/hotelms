"use client";

import { useStore } from "@/lib/store";
import { getSeller } from "@/lib/data";
import { money } from "@/lib/format";
import type { Card } from "@/lib/types";

export function SellerBook({ card }: { card: Card }) {
  const add = useStore((s) => s.addToCart);
  const bag = useStore((s) => s.cart);

  return (
    <div className="mt-6 divide-y divide-line border border-line">
      {[...card.listings]
        .sort((a, b) => a.price - b.price)
        .map((listing) => {
          const seller = getSeller(listing.sellerId);
          const held = bag.some((i) => i.listingId === listing.id);
          return (
            <div
              key={listing.id}
              className="grid items-center gap-4 px-4 py-4 md:grid-cols-12"
            >
              <div className="md:col-span-4">
                <p className="text-sm text-bone">{seller?.name}</p>
                <p className="font-mono text-[11px] text-fog">
                  {seller?.city} · {seller?.rating.toFixed(2)} · {seller?.sales.toLocaleString()} sales
                  {seller?.verified ? " · verified" : ""}
                </p>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm">
                  {listing.company
                    ? `${listing.company} ${listing.grade}`
                    : listing.condition}
                </p>
                {listing.certNumber && (
                  <p className="font-mono text-[11px] text-fog">#{listing.certNumber}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <p className="font-mono text-sm">{money(listing.price)}</p>
                <p className="font-mono text-[11px] text-fog">ship {money(listing.shipping)}</p>
              </div>
              <div className="md:col-span-3 md:text-right">
                <button
                  type="button"
                  onClick={() => add(listing.id, card.id)}
                  className="h-10 border border-line px-4 text-xs uppercase tracking-[0.14em] hover:border-candy hover:text-candy"
                >
                  {held ? "In bag" : "Lift ask"}
                </button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
