"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { clsx } from "clsx";
import type { Card } from "@/lib/types";
import { formatPrice, formatPriceChange } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Badge } from "./Badge";

interface CardTileProps {
  card: Card;
  variant?: "default" | "compact" | "featured";
  priority?: boolean;
}

export function CardTile({ card, variant = "default", priority = false }: CardTileProps) {
  const { toggleWishlist, isInWishlist } = useStore();
  const wished = isInWishlist(card.id);
  const isUp = card.priceChange30d >= 0;

  if (variant === "featured") {
    return (
      <Link
        href={`/card/${card.slug}`}
        className="group relative flex flex-col card-shine bg-surface border border-border hover:border-border-strong transition-colors duration-300"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-cream-dark">
          <Image
            src={card.image}
            alt={card.name}
            fill
            priority={priority}
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(card.id);
            }}
            className="absolute top-3 right-3 p-2 bg-surface/90 backdrop-blur-sm border border-border hover:border-border-strong transition-colors"
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={clsx("w-4 h-4 transition-colors", wished && "fill-danger text-danger")}
            />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg leading-tight group-hover:text-accent transition-colors">
                {card.name}
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                {card.set} · {card.number}
              </p>
            </div>
            {card.featured && <Badge variant="accent">Featured</Badge>}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-lg font-medium">{formatPrice(card.marketPrice)}</span>
            <span
              className={clsx(
                "text-xs font-medium font-mono",
                isUp ? "text-success" : "text-danger"
              )}
            >
              {formatPriceChange(card.priceChange30d)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/card/${card.slug}`}
      className={clsx(
        "group flex flex-col card-shine bg-surface border border-border hover:border-border-strong transition-all duration-300",
        variant === "compact" ? "" : "hover:-translate-y-0.5"
      )}
    >
      <div
        className={clsx(
          "relative overflow-hidden bg-cream-dark",
          variant === "compact" ? "aspect-square" : "aspect-[3/4]"
        )}
      >
        <Image
          src={card.image}
          alt={card.name}
          fill
          priority={priority}
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 50vw, 20vw"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(card.id);
          }}
          className="absolute top-2 right-2 p-1.5 bg-surface/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={clsx("w-3.5 h-3.5", wished && "fill-danger text-danger")}
          />
        </button>
        {card.isNew && (
          <span className="absolute top-2 left-2">
            <Badge variant="accent">New</Badge>
          </span>
        )}
      </div>
      <div className={clsx("flex flex-col gap-1", variant === "compact" ? "p-2.5" : "p-3.5")}>
        <h3
          className={clsx(
            "font-medium leading-tight group-hover:text-accent transition-colors truncate",
            variant === "compact" ? "text-sm" : "text-sm"
          )}
        >
          {card.name}
        </h3>
        <p className="text-[11px] text-ink-muted truncate">{card.set}</p>
        <div className="flex items-baseline justify-between mt-auto pt-1">
          <span className="font-mono text-sm font-medium">{formatPrice(card.marketPrice)}</span>
          <span
            className={clsx(
              "text-[10px] font-mono",
              isUp ? "text-success" : "text-danger"
            )}
          >
            {formatPriceChange(card.priceChange30d)}
          </span>
        </div>
      </div>
    </Link>
  );
}
