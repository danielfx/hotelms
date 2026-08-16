import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardTile } from "@/components/ui/CardTile";
import { getFeaturedCards } from "@/data/cards";

export function FeaturedCards() {
  const featured = getFeaturedCards().slice(0, 4);

  return (
    <section className="py-16 lg:py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-2">
              Curated Selection
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">Featured Cards</h2>
          </div>
          <Link
            href="/marketplace"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-accent transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.map((card, i) => (
            <CardTile key={card.id} card={card} variant="featured" priority={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
