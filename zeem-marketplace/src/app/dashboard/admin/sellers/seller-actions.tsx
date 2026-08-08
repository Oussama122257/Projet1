"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function SellerActions({ storeId, isActive }: { storeId: string; isActive: boolean }) {
  const router = useRouter();
  const act = useMutation({
    mutationFn: async (action: "approve" | "reject") => {
      const res = await fetch(`/api/admin/sellers/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Erreur");
    },
    onSuccess: () => router.refresh(),
  });

  if (isActive) {
    return (
      <Button size="sm" variant="destructive" disabled={act.isPending} onClick={() => act.mutate("reject")}>
        Suspendre
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="success" disabled={act.isPending} onClick={() => act.mutate("approve")}>
        Approuver
      </Button>
      <Button size="sm" variant="ghost" disabled={act.isPending} onClick={() => act.mutate("reject")}>
        Rejeter
      </Button>
    </div>
  );
}
