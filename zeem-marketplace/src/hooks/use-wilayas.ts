"use client";

import { useQuery } from "@tanstack/react-query";

export interface WilayaDTO {
  id: string;
  name: string;
  code: number;
  communes: Array<{ id: string; name: string }>;
}

/** Wilayas + communes, fetched once and cached client-side for the session. */
export function useWilayas() {
  return useQuery<WilayaDTO[]>({
    queryKey: ["wilayas"],
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch("/api/wilayas");
      if (!res.ok) throw new Error("wilayas fetch failed");
      const data = (await res.json()) as { wilayas: WilayaDTO[] };
      return data.wilayas;
    },
  });
}
