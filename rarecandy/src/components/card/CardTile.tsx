"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { CardVisual } from "./CardVisual";
import type { Card } from "@/lib/types";
import { getSetById } from "@/lib/data";
import { classNames, money, pct } from "@/lib/format";
import { useStore } from "@/lib/store";

export function CardTile({ card }: { card: Card }) {
  const set = getSetById(card.setId);
  const saved = useStore((s) => s.wishlist.includes(card.id));
  const toggle = useStore((s) => s.toggleWishlist);
  const up = card.change7d >= 0;

  return (
    <article className="relative">
      <button
        type="button"
        onClick={() => toggle(card.id)}
        className={classNames(
          "absolute right-1 top-1 z-10 grid h-8 w-8 place-items-center border border-line bg-void/80 text-fog",
          saved && "border-candy text-candy",
        )}
        aria-label={saved ? "Unsave" : "Save lot"}
      >
        <Bookmark className={classNames("h-4 w-4", saved && "fill-current")} />
      </button>
      <Link href={`/lot/${card.slug}`} className="block">
        <CardVisual card={card} />
        <div className="mt-3 space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
            {set?.name} · {card.number}
          </p>
          <h3 className="display text-[1.35rem] font-semibold leading-none">{card.name}</h3>
          <p className="text-xs text-fog">{card.rarity}</p>
          <div className="flex items-baseline justify-between pt-1">
            <p className="font-mono text-sm text-bone">{money(card.marketPrice)}</p>
            <p className={classNames("font-mono text-xs", up ? "text-mint" : "text-warn")}>
              {pct(card.change7d)}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
