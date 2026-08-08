"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  size?: string;
  color?: string;
  storeId: string;
  storeName: string;
  storeWilaya: string; // shown so buyers understand multi-shipment splits
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string, size?: string, color?: string) => void;
  setQuantity: (productId: string, qty: number, size?: string, color?: string) => void;
  clear: () => void;
  itemsTotal: () => number;
  count: () => number;
  /** Distinct stores in cart = number of shipments at checkout. */
  storeCount: () => number;
}

const keyOf = (i: { productId: string; size?: string; color?: string }) =>
  `${i.productId}|${i.size ?? ""}|${i.color ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const key = keyOf(item);
          const existing = state.items.find((i) => keyOf(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                keyOf(i) === key ? { ...i, quantity: i.quantity + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: qty }] };
        }),
      remove: (productId, size, color) =>
        set((state) => ({
          items: state.items.filter((i) => keyOf(i) !== keyOf({ productId, size, color })),
        })),
      setQuantity: (productId, qty, size, color) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              keyOf(i) === keyOf({ productId, size, color }) ? { ...i, quantity: qty } : i
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      itemsTotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
      storeCount: () => new Set(get().items.map((i) => i.storeId)).size,
    }),
    { name: "zeem-cart" }
  )
);
