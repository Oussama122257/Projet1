import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="rounded-sm">
            <Logo />
          </Link>
        </div>
      </header>

      <div className="grid-lines flex flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="font-display text-display-md text-accent">404</p>
          <h1 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-ink">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            The link may be out of date, or the campaign you&apos;re looking for
            has been archived.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild>
              <Link href="/dashboard">
                <Compass className="size-4" />
                Back to your dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
