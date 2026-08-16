import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Share2, TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";
import { cards, getListingsForCard } from "@/data/cards";
import { getCardBySlug, getRelatedCards, formatPrice, formatPriceChange } from "@/lib/utils";
import { CardGallery } from "@/components/card/CardGallery";
import { PriceChart } from "@/components/card/PriceChart";
import { RecentSalesTable } from "@/components/card/RecentSales";
import { GradedPopulationTable } from "@/components/card/GradedPopulation";
import { SellerListings } from "@/components/card/SellerListings";
import { RelatedCards } from "@/components/card/RelatedCards";
import { Badge } from "@/components/ui/Badge";
import { WishlistButton } from "@/components/card/WishlistButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return cards.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(cards, slug);
  if (!card) return { title: "Card Not Found" };
  return {
    title: `${card.name} — ${card.set}`,
    description: card.description,
  };
}

export default async function CardDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const card = getCardBySlug(cards, slug);
  if (!card) notFound();

  const listings = getListingsForCard(card.id);
  const related = getRelatedCards(cards, card);
  const lowestListing = listings.length
    ? Math.min(...listings.map((l) => l.price))
    : null;
  const isUp = card.priceChange30d >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <nav className="text-xs text-ink-faint mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <Link href="/marketplace" className="hover:text-ink transition-colors">Marketplace</Link>
        <span>/</span>
        <Link href={`/sets/${card.setSlug}`} className="hover:text-ink transition-colors">
          {card.set}
        </Link>
        <span>/</span>
        <span className="text-ink-muted">{card.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
        <CardGallery image={card.image} name={card.name} />

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline">{card.rarity}</Badge>
                {card.featured && <Badge variant="accent">Featured</Badge>}
                {card.trending && <Badge variant="default">Trending</Badge>}
                {card.isNew && <Badge variant="accent">New</Badge>}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">
                {card.name}
              </h1>
              <p className="mt-2 text-ink-muted">
                {card.set} · {card.number} · {card.year}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <WishlistButton cardId={card.id} />
              <button className="p-2.5 border border-border hover:border-ink transition-colors" aria-label="Share">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 p-6 bg-surface border border-border">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-faint mb-1">
                  Market Value
                </p>
                <p className="font-mono text-3xl sm:text-4xl font-medium">
                  {formatPrice(card.marketPrice)}
                </p>
              </div>
              <div
                className={clsx(
                  "flex items-center gap-1 text-sm font-medium font-mono",
                  isUp ? "text-success" : "text-danger"
                )}
              >
                {isUp ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {formatPriceChange(card.priceChange30d)} (30d)
              </div>
            </div>
            {lowestListing && (
              <p className="mt-3 text-sm text-ink-muted">
                Lowest listing:{" "}
                <span className="font-mono font-medium text-ink">
                  {formatPrice(lowestListing)}
                </span>
                <span className="text-ink-faint"> · {listings.length} available</span>
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Type", value: card.type },
              { label: "HP", value: card.hp?.toString() },
              { label: "Artist", value: card.artist },
              { label: "Year", value: card.year.toString() },
            ]
              .filter((d) => d.value)
              .map((detail) => (
                <div key={detail.label}>
                  <p className="text-[10px] uppercase tracking-widest text-ink-faint">
                    {detail.label}
                  </p>
                  <p className="text-sm font-medium mt-0.5 truncate">{detail.value}</p>
                </div>
              ))}
          </div>

          <p className="mt-6 text-sm text-ink-muted leading-relaxed">
            {card.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {card.tags.map((tag) => (
              <Link
                key={tag}
                href={`/marketplace?q=${tag}`}
                className="px-2 py-0.5 text-[11px] bg-cream-dark text-ink-muted hover:text-ink transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-16">
        <section>
          <h2 className="font-display text-2xl mb-6">Price History</h2>
          <div className="p-6 bg-surface border border-border">
            <PriceChart data={card.priceHistory} />
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-6">Recent Sales</h2>
          <div className="p-6 bg-surface border border-border">
            <RecentSalesTable sales={card.recentSales} />
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">Available Listings</h2>
          <p className="text-sm text-ink-muted mb-6">
            {listings.length} seller{listings.length !== 1 ? "s" : ""} · Sorted by price
          </p>
          {listings.length > 0 ? (
            <SellerListings listings={listings} />
          ) : (
            <p className="text-ink-muted py-8 text-center border border-border bg-surface">
              No listings available for this card.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl mb-6">Graded Population</h2>
          <div className="p-6 bg-surface border border-border">
            <GradedPopulationTable data={card.gradedPopulation} />
          </div>
        </section>

        {related.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-6">Related Cards</h2>
            <RelatedCards cards={related} />
          </section>
        )}
      </div>
    </div>
  );
}
