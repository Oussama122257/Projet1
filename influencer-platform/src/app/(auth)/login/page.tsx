import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Sign in to your PayLoop account.
        </p>
      </div>

      <div className="mt-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-sm text-ink-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
