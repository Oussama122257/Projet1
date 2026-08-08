"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type, value: Number(value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
    },
    onSuccess: () => {
      setCode("");
      setValue("");
      setError(null);
      router.refresh();
    },
    onError: (e) => setError((e as Error).message),
  });

  return (
    <form
      className="mb-4 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <Input
        className="w-32 font-mono uppercase"
        placeholder="RAMADAN20"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
      />
      <Select className="w-32" value={type} onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}>
        <option value="PERCENT">%</option>
        <option value="FIXED">DA fixe</option>
      </Select>
      <Input
        className="w-24"
        type="number"
        min={1}
        placeholder={type === "PERCENT" ? "20" : "500"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
      />
      <Button type="submit" size="sm" variant="gold" disabled={create.isPending}>
        Créer
      </Button>
      {error && <p className="w-full text-xs font-medium text-red-600">{error}</p>}
    </form>
  );
}
