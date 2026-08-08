"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { phone, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      // "CredentialsSignin" = wrong phone/password. Anything else means the
      // server itself failed (missing AUTH_SECRET, unreachable DATABASE_URL,
      // unseeded database…) — surface that so it's debuggable.
      setError(
        res.error === "CredentialsSignin"
          ? "Téléphone ou mot de passe incorrect."
          : `Erreur serveur (${res.error}). Vérifiez AUTH_SECRET et DATABASE_URL dans .env, que la base est bien remplie (seed), puis redémarrez le serveur.`
      );
    } else {
      router.push(params.get("callbackUrl") ?? "/");
      router.refresh();
    }
  };

  return (
    <>
      <h1 className="text-xl font-bold text-navy-700">Connexion</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0550 12 34 56" required />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <Button type="submit" variant="gold" className="w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
        Continuer avec Google
      </Button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-gold-600 hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
