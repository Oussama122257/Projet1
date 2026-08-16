import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative border-b border-border/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="rounded-sm">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-[26rem] animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
