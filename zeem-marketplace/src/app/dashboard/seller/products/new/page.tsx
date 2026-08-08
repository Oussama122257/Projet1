"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Tag } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_CATEGORIES } from "@/data/wilayas";
import { formatDZD } from "@/lib/utils";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Product creation form with the two seller AI assists:
 *  - "Générer avec IA": writes title/description/bullets from name+attributes
 *  - "Prix conseillé": competitive band from similar products in the wilaya
 */
export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Robes");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock] = useState("10");
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState("");
  const [images, setImages] = useState("");
  const [aiUsed, setAiUsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          sizes,
          colors: colors.split(",").map((c) => c.trim()).filter(Boolean),
          price: price ? Number(price) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur IA");
      return data as { description: string; descriptionAr: string; bullets: string[] };
    },
    onSuccess: (data) => {
      setDescription(
        `${data.description}\n\n${data.bullets.map((b) => `• ${b}`).join("\n")}\n\n${data.descriptionAr}`
      );
      setAiUsed(true);
    },
  });

  const suggestPrice = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/suggest-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      return data as { suggested: number; suggestedMin: number; suggestedMax: number; sampleSize: number; scope: string };
    },
    onSuccess: (data) => {
      if (data.suggested > 0) setPrice(String(data.suggested));
    },
  });

  const save = useMutation({
    mutationFn: async (status: "DRAFT" | "PUBLISHED") => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          price: Number(price),
          comparePrice: comparePrice ? Number(comparePrice) : null,
          stock: Number(stock),
          sizes,
          colors: colors.split(",").map((c) => c.trim()).filter(Boolean),
          images: images.split("\n").map((u) => u.trim()).filter(Boolean),
          status,
          aiGeneratedDesc: aiUsed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      return data;
    },
    onSuccess: () => router.push("/dashboard/seller/products"),
    onError: (e) => setError((e as Error).message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-navy-700">Nouveau produit</h1>

      <div className="glass space-y-4 p-5">
        <div>
          <Label htmlFor="p-name">Nom du produit</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kaftan brodé fil doré…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="p-cat">Catégorie</Label>
            <Select id="p-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="p-stock">Stock</Label>
            <Input id="p-stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="p-desc">Description</Label>
            <Button
              type="button"
              size="sm"
              variant="gold"
              onClick={() => generate.mutate()}
              disabled={!name || generate.isPending}
            >
              <Sparkles className="h-4 w-4" />
              {generate.isPending ? "Génération…" : "Générer avec IA"}
            </Button>
          </div>
          <Textarea
            id="p-desc"
            className="mt-2 min-h-[160px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre produit — ou laissez l'IA le faire ✨"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="p-price">Prix (DA)</Label>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-gold-600 hover:underline"
                onClick={() => suggestPrice.mutate()}
              >
                <Tag className="h-3 w-3" /> Prix conseillé
              </button>
            </div>
            <Input id="p-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            {suggestPrice.data && suggestPrice.data.suggested > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Marché ({suggestPrice.data.scope === "wilaya" ? "votre wilaya" : "national"},{" "}
                {suggestPrice.data.sampleSize} produits): {formatDZD(suggestPrice.data.suggestedMin)} –{" "}
                {formatDZD(suggestPrice.data.suggestedMax)}
              </p>
            )}
            {suggestPrice.data && suggestPrice.data.suggested === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Pas assez de données marché pour cette catégorie.</p>
            )}
          </div>
          <div>
            <Label htmlFor="p-compare">Ancien prix (promo, optionnel)</Label>
            <Input id="p-compare" type="number" min={0} value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Tailles disponibles</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
                }
                className={`h-9 min-w-9 rounded-xl border-2 px-2 text-sm font-bold ${
                  sizes.includes(s) ? "border-gold bg-gold text-navy-800" : "border-border bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="p-colors">Couleurs (séparées par des virgules)</Label>
          <Input id="p-colors" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Vert, Doré, Noir" />
        </div>

        <div>
          <Label htmlFor="p-images">Images (une URL par ligne)</Label>
          <Textarea id="p-images" value={images} onChange={(e) => setImages(e.target.value)} placeholder="https://…" />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" disabled={save.isPending} onClick={() => save.mutate("DRAFT")}>
            Enregistrer en brouillon
          </Button>
          <Button variant="gold" className="flex-1" disabled={save.isPending || !name || !price} onClick={() => save.mutate("PUBLISHED")}>
            Publier
          </Button>
        </div>
      </div>
    </div>
  );
}
