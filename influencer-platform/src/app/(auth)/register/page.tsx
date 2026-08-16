import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Run performance campaigns, or get paid for them.
        </p>
      </div>

      <div className="mt-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-sm text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
