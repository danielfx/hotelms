import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { sets } from "@/data/sets";
import { getCardsBySet } from "@/data/cards";
import { formatPrice } from "@/lib/utils";

export function PopularSets() {
  const featuredSets = sets.filter((s) => s.featured);

  return (
    <section className="py-16 lg:py-20 bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-muted mb-2">
              Browse by Set
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">Popular Sets</h2>
          </div>
          <Link
            href="/marketplace"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-cream/60 hover:text-cream transition-colors"
          >
            All sets <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredSets.map((set) => {
            const setCards = getCardsBySet(set.slug);
            const floorPrice = setCards.length
              ? Math.min(...setCards.map((c) => c.marketPrice))
              : 0;

            return (
              <Link
                key={set.id}
                href={`/sets/${set.slug}`}
                className="group relative overflow-hidden border border-cream/10 hover:border-accent/40 transition-all duration-300"
              >
                <div className="aspect-[4/3] relative bg-cream/5">
                  <Image
                    src={set.image}
                    alt={set.name}
                    fill
                    className="object-contain p-6 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <div className="p-4 border-t border-cream/10">
                  <h3 className="font-display text-lg group-hover:text-accent-muted transition-colors">
                    {set.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-cream/40">
                      {set.year} · {setCards.length} listings
                    </p>
                    <p className="text-xs font-mono text-cream/60">
                      from {formatPrice(floorPrice)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
