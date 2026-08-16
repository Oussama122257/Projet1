"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surface it for whatever monitoring is wired up in production.
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-danger/25 bg-danger-muted">
          <AlertTriangle className="size-5 text-danger" aria-hidden />
        </div>

        <h1 className="mt-5 font-display text-xl font-semibold tracking-[-0.02em] text-ink">
          Something broke on our side
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          This page failed to render. Your data is untouched — no earnings or
          payouts are affected by a display error.
        </p>

        {error.digest && (
          <p className="mt-3 text-xs text-ink-tertiary">
            Reference: <code className="text-ink-secondary">{error.digest}</code>
          </p>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>
            <RotateCw className="size-4" />
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
