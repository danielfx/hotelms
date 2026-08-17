"use client";

import Link from "next/link";
import { CardTile } from "@/components/card/CardTile";
import { cards } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function SavedPage() {
  const ids = useStore((s) => s.wishlist);
  const lots = cards.filter((card) => ids.includes(card.id));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-candy">Watchline</p>
      <h1 className="display mt-2 text-5xl font-semibold uppercase">Saved</h1>
      {lots.length === 0 ? (
        <div className="mt-16 border border-line bg-stage p-10">
          <p className="text-fog">No lots pinned. Bookmark from the floor.</p>
          <Link href="/shop" className="mt-4 inline-flex h-11 items-center border border-bone/30 px-5 text-sm">
            Open the book
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {lots.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
