"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Role = "BRAND" | "INFLUENCER";

const ROLES: { value: Role; label: string; body: string; icon: typeof Building2 }[] = [
  {
    value: "BRAND",
    label: "I'm a brand",
    body: "Run campaigns and pay for verified performance",
    icon: Building2,
  },
  {
    value: "INFLUENCER",
    label: "I'm a creator",
    body: "Get tracked, get screened, get paid automatically",
    icon: Sparkles,
  },
];

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();

  const initialRole: Role =
    params.get("role")?.toUpperCase() === "BRAND" ? "BRAND" : "INFLUENCER";

  const [role, setRole] = React.useState<Role>(initialRole);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    handle: "",
    country: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [loading, setLoading] = React.useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        ...(role === "BRAND"
          ? { companyName: form.companyName || undefined }
          : { handle: form.handle || undefined }),
        ...(form.country ? { country: form.country.toUpperCase() } : {}),
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      setError(body?.error?.message ?? "Could not create your account");
      setFieldErrors(body?.error?.details ?? {});
      setLoading(false);
      return;
    }

    // Registration succeeded — sign straight in rather than bouncing to /login.
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger/25 bg-danger-muted px-3 py-2.5 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <div className="grid gap-2.5" role="radiogroup" aria-label="Account type">
        {ROLES.map((option) => {
          const selected = role === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setRole(option.value)}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3.5 text-left transition-all",
                selected
                  ? "border-accent/50 bg-accent-muted/50"
                  : "border-border bg-surface-raised hover:border-ink-tertiary/40"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border",
                  selected
                    ? "border-accent/40 bg-accent-muted text-accent"
                    : "border-border bg-surface-overlay text-ink-tertiary"
                )}
              >
                <option.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-secondary">
                  {option.body}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Field
        label="Full name"
        htmlFor="name"
        error={fieldErrors.name?.[0]}
      >
        <Input id="name" required value={form.name} onChange={set("name")} />
      </Field>

      <Field label="Email" htmlFor="email" error={fieldErrors.email?.[0]}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set("email")}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        hint="8 characters minimum"
        error={fieldErrors.password?.[0]}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={set("password")}
        />
      </Field>

      {role === "BRAND" ? (
        <Field
          label="Company"
          htmlFor="companyName"
          error={fieldErrors.companyName?.[0]}
        >
          <Input
            id="companyName"
            value={form.companyName}
            onChange={set("companyName")}
            placeholder="Atlas Mobile"
          />
        </Field>
      ) : (
        <Field
          label="Handle"
          htmlFor="handle"
          hint="Letters, numbers, dots and dashes"
          error={fieldErrors.handle?.[0]}
        >
          <Input
            id="handle"
            value={form.handle}
            onChange={set("handle")}
            placeholder="yourhandle"
          />
        </Field>
      )}

      <Field
        label="Country"
        htmlFor="country"
        hint="Two-letter code"
        error={fieldErrors.country?.[0]}
      >
        <Input
          id="country"
          maxLength={2}
          value={form.country}
          onChange={set("country")}
          placeholder="DZ"
          className="uppercase"
        />
      </Field>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Create account
      </Button>
    </form>
  );
}
