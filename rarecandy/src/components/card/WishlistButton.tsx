"use client";

import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useStore } from "@/lib/store";

interface WishlistButtonProps {
  cardId: string;
}

export function WishlistButton({ cardId }: WishlistButtonProps) {
  const { toggleWishlist, isInWishlist } = useStore();
  const wished = isInWishlist(cardId);

  return (
    <button
      onClick={() => toggleWishlist(cardId)}
      className={clsx(
        "p-2.5 border transition-colors",
        wished
          ? "border-danger bg-danger/5 text-danger"
          : "border-border hover:border-ink"
      )}
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={clsx("w-4 h-4", wished && "fill-current")} />
    </button>
  );
}
