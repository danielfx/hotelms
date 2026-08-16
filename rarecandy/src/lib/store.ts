"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./types";

interface StoreState {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (listingId: string, cardId: string) => void;
  removeFromCart: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (cardId: string) => void;
  isInWishlist: (cardId: string) => boolean;
  isInCart: (listingId: string) => boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],

      addToCart: (listingId, cardId) => {
        const existing = get().cart.find((i) => i.listingId === listingId);
        if (existing) {
          set({
            cart: get().cart.map((i) =>
              i.listingId === listingId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ cart: [...get().cart, { listingId, cardId, quantity: 1 }] });
        }
      },

      removeFromCart: (listingId) => {
        set({ cart: get().cart.filter((i) => i.listingId !== listingId) });
      },

      updateQuantity: (listingId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(listingId);
          return;
        }
        set({
          cart: get().cart.map((i) =>
            i.listingId === listingId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ cart: [] }),

      toggleWishlist: (cardId) => {
        const list = get().wishlist;
        if (list.includes(cardId)) {
          set({ wishlist: list.filter((id) => id !== cardId) });
        } else {
          set({ wishlist: [...list, cardId] });
        }
      },

      isInWishlist: (cardId) => get().wishlist.includes(cardId),

      isInCart: (listingId) =>
        get().cart.some((i) => i.listingId === listingId),
    }),
    { name: "rarecandy-store" }
  )
);
