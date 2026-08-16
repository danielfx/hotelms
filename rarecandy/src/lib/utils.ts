import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Card, FilterState, SortOption } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function filterCards(cards: Card[], filters: FilterState): Card[] {
  let result = [...cards];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.set.toLowerCase().includes(q) ||
        c.rarity.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (filters.sets.length) {
    result = result.filter((c) => filters.sets.includes(c.setSlug));
  }

  if (filters.rarities.length) {
    result = result.filter((c) => filters.rarities.includes(c.rarity));
  }

  if (filters.minPrice !== null) {
    result = result.filter((c) => c.marketPrice >= filters.minPrice!);
  }

  if (filters.maxPrice !== null) {
    result = result.filter((c) => c.marketPrice <= filters.maxPrice!);
  }

  return sortCards(result, filters.sort);
}

export function sortCards(cards: Card[], sort: SortOption): Card[] {
  const sorted = [...cards];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.marketPrice - b.marketPrice);
    case "price-desc":
      return sorted.sort((a, b) => b.marketPrice - a.marketPrice);
    case "newest":
      return sorted.sort((a, b) => b.year - a.year);
    case "trending":
      return sorted.sort((a, b) => {
        if (a.trending && !b.trending) return -1;
        if (!a.trending && b.trending) return 1;
        return b.priceChange30d - a.priceChange30d;
      });
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.marketPrice - a.marketPrice;
      });
  }
}

export function getCardBySlug(cards: Card[], slug: string): Card | undefined {
  return cards.find((c) => c.slug === slug);
}

export function getRelatedCards(cards: Card[], card: Card, limit = 4): Card[] {
  return cards
    .filter(
      (c) =>
        c.id !== card.id &&
        (c.setSlug === card.setSlug ||
          c.tags.some((t) => card.tags.includes(t)))
    )
    .slice(0, limit);
}
