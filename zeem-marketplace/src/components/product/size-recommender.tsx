"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * AI Size Recommender popup: "Poids (kg) / Taille (cm)" → S/M/L/XL based on
 * the seller's sizing chart.
 */
export function SizeRecommender({
  productId,
  onRecommend,
}: {
  productId: string;
  onRecommend?: (size: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const reco = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, weightKg: Number(weight), heightCm: Number(height) }),
      });
      return (await res.json()) as { size: string | null; confidence: string; message: string };
    },
    onSuccess: (data) => {
      if (data.size) onRecommend?.(data.size);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reco.reset(); }}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 text-sm font-medium text-gold-600 underline-offset-2 hover:underline">
          <Ruler className="h-4 w-4" /> Quelle est ma taille ?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recommandation de taille</DialogTitle>
          <DialogDescription>
            Entrez vos mensurations — nous comparons avec la grille du vendeur.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            reco.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sr-weight">Poids (kg)</Label>
              <Input id="sr-weight" type="number" min={25} max={250} value={weight} onChange={(e) => setWeight(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="sr-height">Taille (cm)</Label>
              <Input id="sr-height" type="number" min={100} max={230} value={height} onChange={(e) => setHeight(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={reco.isPending}>
            {reco.isPending ? "Analyse…" : "Recommander ma taille"}
          </Button>
        </form>
        {reco.data && (
          <div className="mt-4 rounded-xl bg-gold-50 p-4 text-center">
            {reco.data.size ? (
              <>
                <p className="text-3xl font-black text-navy-700">{reco.data.size}</p>
                <p className="mt-1 text-sm text-muted-foreground">{reco.data.message}</p>
                <Button size="sm" className="mt-3" onClick={() => setOpen(false)}>
                  Choisir la taille {reco.data.size}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{reco.data.message}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
