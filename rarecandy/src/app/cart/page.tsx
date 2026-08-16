"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { cards, getListingById } from "@/data/cards";
import { getSellerById } from "@/data/sellers";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { GradeBadge } from "@/components/ui/Badge";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useStore();

  const items = cart
    .map((item) => {
      const listing = getListingById(item.listingId);
      const card = cards.find((c) => c.id === item.cardId);
      const seller = listing ? getSellerById(listing.sellerId) : undefined;
      return { ...item, listing, card, seller };
    })
    .filter((item) => item.listing && item.card);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.listing!.price * item.quantity),
    0
  );
  const shipping = items.reduce(
    (sum, item) => sum + (item.listing!.shipping * item.quantity),
    0
  );
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-ink-faint mb-4" />
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-ink-muted">Browse the marketplace to find your next grail.</p>
        <Link href="/marketplace" className="inline-block mt-6">
          <Button size="lg">
            Explore Marketplace
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">
          Cart ({items.length})
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-ink-muted hover:text-danger transition-colors"
        >
          Clear cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ listing, card, seller, quantity, listingId }) => (
            <div
              key={listingId}
              className="flex gap-4 p-4 bg-surface border border-border"
            >
              <Link
                href={`/card/${card!.slug}`}
                className="relative w-20 h-28 shrink-0 bg-cream-dark"
              >
                <Image
                  src={card!.image}
                  alt={card!.name}
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/card/${card!.slug}`}
                  className="font-medium hover:text-accent transition-colors"
                >
                  {card!.name}
                </Link>
                <p className="text-xs text-ink-muted mt-0.5">
                  {card!.set} · {card!.number}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {listing!.gradeCompany && listing!.grade ? (
                    <GradeBadge
                      company={listing!.gradeCompany}
                      grade={listing!.grade}
                    />
                  ) : (
                    <span className="text-xs text-ink-muted">{listing!.condition}</span>
                  )}
                </div>
                {seller && (
                  <p className="text-xs text-ink-faint mt-1">Sold by {seller.name}</p>
                )}
              </div>

              <div className="flex flex-col items-end justify-between shrink-0">
                <p className="font-mono font-medium">{formatPrice(listing!.price)}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(listingId, quantity - 1)}
                    className="p-1 border border-border hover:border-ink transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-mono w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(listingId, quantity + 1)}
                    className="p-1 border border-border hover:border-ink transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(listingId)}
                    className="p-1 text-ink-faint hover:text-danger transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="p-6 bg-surface border border-border sticky top-24">
            <h2 className="font-display text-xl mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Subtotal</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Shipping</span>
                <span className="font-mono">{formatPrice(shipping)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-medium">
                <span>Total</span>
                <span className="font-mono text-lg">{formatPrice(total)}</span>
              </div>
            </div>
            <Button size="lg" className="w-full mt-6">
              Proceed to Checkout
            </Button>
            <p className="mt-3 text-[11px] text-ink-faint text-center">
              Demo checkout — no payment processed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
