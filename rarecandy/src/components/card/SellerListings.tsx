"use client";

import { ShoppingBag, Star, Shield, Truck } from "lucide-react";
import type { SellerListing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { getSellerById } from "@/data/sellers";
import { GradeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";

interface SellerListingsProps {
  listings: SellerListing[];
}

export function SellerListings({ listings }: SellerListingsProps) {
  const { addToCart, isInCart } = useStore();

  const sorted = [...listings].sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-3">
      {sorted.map((listing) => {
        const seller = getSellerById(listing.sellerId);
        const inCart = isInCart(listing.id);

        return (
          <div
            key={listing.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface border border-border hover:border-border-strong transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {listing.gradeCompany && listing.grade ? (
                  <GradeBadge company={listing.gradeCompany} grade={listing.grade} />
                ) : (
                  <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                    {listing.condition}
                  </span>
                )}
                {listing.certNumber && (
                  <span className="text-[10px] font-mono text-ink-faint">
                    #{listing.certNumber}
                  </span>
                )}
              </div>

              {seller && (
                <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
                  <span className="font-medium text-ink">{seller.name}</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-accent text-accent" />
                    {seller.rating}
                  </span>
                  <span>{seller.sales.toLocaleString()} sales</span>
                  {seller.verified && (
                    <span className="flex items-center gap-0.5 text-success">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              )}

              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-faint">
                <Truck className="w-3 h-3" />
                +{formatPrice(listing.shipping)} shipping
                <span>·</span>
                {listing.photos} photos
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="font-mono text-lg font-medium">{formatPrice(listing.price)}</p>
                <p className="text-[11px] text-ink-faint">
                  {formatPrice(listing.price + listing.shipping)} total
                </p>
              </div>
              <Button
                size="sm"
                variant={inCart ? "secondary" : "primary"}
                onClick={() => addToCart(listing.id, listing.cardId)}
                disabled={inCart}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {inCart ? "In Cart" : "Add"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
