"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Buyer's browsing wilaya. Buyers can browse ALL wilayas — this only powers
 * "Tendances dans votre wilaya" and local-first search ranking. The binding
 * wilaya/commune choice happens at checkout.
 */
interface WilayaState {
  wilayaId: string | null;
  wilayaName: string | null;
  setWilaya: (id: string | null, name: string | null) => void;
}

export const useWilaya = create<WilayaState>()(
  persist(
    (set) => ({
      wilayaId: null,
      wilayaName: null,
      setWilaya: (wilayaId, wilayaName) => set({ wilayaId, wilayaName }),
    }),
    { name: "zeem-wilaya" }
  )
);
