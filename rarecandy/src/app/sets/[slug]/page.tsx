import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { sets, getSetBySlug } from "@/data/sets";
import { getCardsBySet } from "@/data/cards";
import { CardTile } from "@/components/ui/CardTile";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return sets.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const set = getSetBySlug(slug);
  if (!set) return { title: "Set Not Found" };
  return {
    title: set.name,
    description: set.description,
  };
}

export default async function SetPage({ params }: PageProps) {
  const { slug } = await params;
  const set = getSetBySlug(slug);
  if (!set) notFound();

  const setCards = getCardsBySet(slug);
  const floorPrice = setCards.length
    ? Math.min(...setCards.map((c) => c.marketPrice))
    : 0;
  const avgPrice = setCards.length
    ? setCards.reduce((s, c) => s + c.marketPrice, 0) / setCards.length
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <nav className="text-xs text-ink-faint mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <Link href="/marketplace" className="hover:text-ink transition-colors">Marketplace</Link>
        <span>/</span>
        <span className="text-ink-muted">{set.name}</span>
      </nav>

      <div className="grid md:grid-cols-[200px_1fr] gap-8 mb-12">
        <div className="relative aspect-[3/4] max-w-[200px] bg-surface border border-border">
          <Image
            src={set.image}
            alt={set.name}
            fill
            className="object-contain p-4"
            sizes="200px"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-2">
            {set.year} · {set.cardCount} cards in set
          </p>
          <h1 className="font-display text-3xl sm:text-4xl">{set.name}</h1>
          <p className="mt-4 text-ink-muted leading-relaxed max-w-2xl">
            {set.description}
          </p>
          <div className="mt-6 flex gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-faint">Listings</p>
              <p className="font-mono text-lg font-medium">{setCards.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-faint">Floor Price</p>
              <p className="font-mono text-lg font-medium">{formatPrice(floorPrice)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-faint">Avg. Price</p>
              <p className="font-mono text-lg font-medium">{formatPrice(avgPrice)}</p>
            </div>
          </div>
        </div>
      </div>

      {setCards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {setCards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <p className="text-center py-16 text-ink-muted">
          No listings available for this set yet.
        </p>
      )}
    </div>
  );
}
