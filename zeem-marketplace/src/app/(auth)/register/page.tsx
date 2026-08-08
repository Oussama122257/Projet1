"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useWilayas } from "@/hooks/use-wilayas";

export default function RegisterPage() {
  const router = useRouter();
  const { data: wilayas } = useWilayas();
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [wilayaId, setWilayaId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, password, role, storeName, wilayaId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur d'inscription.");
      setLoading(false);
      return;
    }
    // Auto-login after registration
    await signIn("credentials", { phone, password, redirect: false });
    router.push(role === "SELLER" ? "/dashboard/seller" : "/");
    router.refresh();
  };

  return (
    <>
      <h1 className="text-xl font-bold text-navy-700">Créer un compte</h1>
      <Tabs value={role} onValueChange={(v) => setRole(v as "BUYER" | "SELLER")} className="mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="BUYER" className="flex-1">🛍️ Acheteur</TabsTrigger>
          <TabsTrigger value="SELLER" className="flex-1">🏪 Vendeur</TabsTrigger>
        </TabsList>
        <TabsContent value="SELLER">
          <p className="rounded-xl bg-gold-50 p-3 text-xs text-navy-700">
            Votre boutique sera vérifiée par l&apos;équipe Zeem avant activation (registre de commerce requis).
          </p>
        </TabsContent>
      </Tabs>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <Label htmlFor="r-name">Nom complet</Label>
          <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="r-phone">Téléphone (+213)</Label>
          <Input id="r-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0550 12 34 56" required />
        </div>
        <div>
          <Label htmlFor="r-email">Email (optionnel)</Label>
          <Input id="r-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="r-password">Mot de passe</Label>
          <Input id="r-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </div>

        {role === "SELLER" && (
          <>
            <div>
              <Label htmlFor="r-store">Nom de la boutique</Label>
              <Input id="r-store" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="r-wilaya">Wilaya de la boutique</Label>
              <Select id="r-wilaya" value={wilayaId} onChange={(e) => setWilayaId(e.target.value)} required>
                <option value="">Choisir…</option>
                {wilayas?.map((w) => (
                  <option key={w.id} value={w.id}>{String(w.code).padStart(2, "0")} — {w.name}</option>
                ))}
              </Select>
            </div>
          </>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <Button type="submit" variant="gold" className="w-full" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-gold-600 hover:underline">Connexion</Link>
      </p>
    </>
  );
}
