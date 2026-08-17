"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./types";
import { cards, getListing } from "./data";

interface RareCandyStore {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (listingId: string, cardId: string) => void;
  removeFromCart: (listingId: string) => void;
  setQty: (listingId: string, quantity: number) => void;
  toggleWishlist: (cardId: string) => void;
  clearCart: () => void;
}

export const useStore = create<RareCandyStore>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      addToCart: (listingId, cardId) => {
        const found = getListing(listingId);
        if (!found) return;
        const existing = get().cart.find((item) => item.listingId === listingId);
        if (existing) {
          set({
            cart: get().cart.map((item) =>
              item.listingId === listingId
                ? {
                    ...item,
                    quantity: Math.min(item.quantity + 1, found.listing.quantity),
                  }
                : item,
            ),
          });
          return;
        }
        set({ cart: [...get().cart, { listingId, cardId, quantity: 1 }] });
      },
      removeFromCart: (listingId) =>
        set({ cart: get().cart.filter((item) => item.listingId !== listingId) }),
      setQty: (listingId, quantity) => {
        if (quantity < 1) {
          set({ cart: get().cart.filter((item) => item.listingId !== listingId) });
          return;
        }
        set({
          cart: get().cart.map((item) =>
            item.listingId === listingId ? { ...item, quantity } : item,
          ),
        });
      },
      toggleWishlist: (cardId) => {
        const has = get().wishlist.includes(cardId);
        set({
          wishlist: has
            ? get().wishlist.filter((id) => id !== cardId)
            : [...get().wishlist, cardId],
        });
      },
      clearCart: () => set({ cart: [] }),
    }),
    { name: "rarecandy-after-dark" },
  ),
);

export function cartTotals(cart: CartItem[]) {
  return cart.reduce(
    (acc, item) => {
      const found = getListing(item.listingId);
      const card = cards.find((c) => c.id === item.cardId);
      if (!found || !card) return acc;
      acc.subtotal += found.listing.price * item.quantity;
      acc.shipping += found.listing.shipping;
      acc.count += item.quantity;
      return acc;
    },
    { subtotal: 0, shipping: 0, count: 0 },
  );
}
