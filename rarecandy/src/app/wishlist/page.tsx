"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { cards } from "@/data/cards";
import { useStore } from "@/lib/store";
import { CardTile } from "@/components/ui/CardTile";
import { Button } from "@/components/ui/Button";

export default function WishlistPage() {
  const { wishlist } = useStore();
  const wishlistCards = cards.filter((c) => wishlist.includes(c.id));

  if (wishlistCards.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Heart className="w-12 h-12 mx-auto text-ink-faint mb-4" />
        <h1 className="font-display text-3xl">Your wishlist is empty</h1>
        <p className="mt-2 text-ink-muted">
          Save cards you love by clicking the heart icon.
        </p>
        <Link href="/marketplace" className="inline-block mt-6">
          <Button size="lg">
            Browse Cards
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Wishlist</h1>
      <p className="text-ink-muted mb-8">
        {wishlistCards.length} saved card{wishlistCards.length !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {wishlistCards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
