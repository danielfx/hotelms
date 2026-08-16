"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { CardTile } from "@/components/ui/CardTile";
import { getTrendingCards } from "@/data/cards";

export function TrendingSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trending = getTrendingCards();

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-16 lg:py-20 bg-surface border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-2">
              Hot Right Now
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">Trending Cards</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 border border-border hover:border-ink transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 border border-border hover:border-ink transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {trending.map((card) => (
            <div key={card.id} className="snap-start shrink-0 w-[200px] sm:w-[220px]">
              <CardTile card={card} variant="compact" />
            </div>
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            href="/marketplace?sort=trending"
            className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-accent"
          >
            View all trending <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
