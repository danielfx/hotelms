import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardTile } from "@/components/ui/CardTile";
import { getNewCards } from "@/data/cards";

export function NewArrivals() {
  const newCards = getNewCards().slice(0, 4);

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-2">
              Just Listed
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">New Arrivals</h2>
          </div>
          <Link
            href="/marketplace?filter=new"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-accent transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {newCards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
