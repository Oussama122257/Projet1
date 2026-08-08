"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useWilaya } from "@/stores/wilaya";
import { formatDZD } from "@/lib/utils";

interface Hit {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  store: string;
  wilaya: string;
}

/**
 * AI-powered search bar: understands intent ("robe pour mariage verte") via
 * /api/ai/search, with a live results dropdown. Debounced 400ms.
 */
export function SearchBar() {
  const router = useRouter();
  const { wilayaId } = useWilaya();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["ai-search", debounced, wilayaId],
    enabled: debounced.length >= 3,
    queryFn: async () => {
      const params = new URLSearchParams({ q: debounced });
      if (wilayaId) params.set("wilayaId", wilayaId);
      const res = await fetch(`/api/ai/search?${params}`);
      return (await res.json()) as { products: Hit[] };
    },
  });

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            setOpen(false);
            router.push(`/products?q=${encodeURIComponent(query.trim())}`);
          }
        }}
        className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-gold"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-gold-600" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Recherche IA : « robe pour mariage verte »…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button type="submit" aria-label="Rechercher">
          <Search className="h-4 w-4 text-navy-700" />
        </button>
      </form>

      {open && debounced.length >= 3 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border bg-white p-2 shadow-glass">
          {isFetching && <p className="p-3 text-sm text-muted-foreground">Recherche IA en cours…</p>}
          {!isFetching && data?.products.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Aucun résultat pour « {debounced} »</p>
          )}
          {data?.products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? (
                <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-100 text-lg">👗</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-700">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.store} · {p.wilaya}
                </p>
              </div>
              <span className="text-sm font-bold text-gold-600">{formatDZD(p.price)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
