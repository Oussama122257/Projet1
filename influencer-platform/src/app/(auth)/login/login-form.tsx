"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

/** Demo accounts, surfaced so the seeded database is explorable immediately. */
const DEMO_ACCOUNTS = [
  { label: "Brand", email: "growth@atlasmobile.dz" },
  { label: "Creator", email: "amine@creators.dz" },
  { label: "Admin", email: "admin@payloop.io" },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(
    params.get("error") ? "Those credentials didn't work. Try again." : null
  );
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Those credentials didn't work. Try again.");
      setLoading(false);
      return;
    }

    // The post-login landing page depends on role, which the session knows but
    // this component doesn't yet — /dashboard resolves and forwards.
    router.push(params.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  }

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-danger/25 bg-danger-muted px-3 py-2.5 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" className="w-full" loading={loading} size="lg">
          Sign in
        </Button>
      </form>

      <div className="rounded-md border border-border bg-surface-raised p-4">
        <p className="text-xs font-medium text-ink-secondary">
          Explore the seeded demo data
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fillDemoAccount(account.email)}
            >
              {account.label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-tertiary">
          Fills the form with a demo account. Password is{" "}
          <code className="text-ink-secondary">password123</code>.
        </p>
      </div>
    </div>
  );
}
