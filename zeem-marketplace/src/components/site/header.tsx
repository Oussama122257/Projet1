"use client";

import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "@/stores/cart";
import { SearchBar } from "./search-bar";
import { WilayaSelect } from "./wilaya-select";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  SELLER: "/dashboard/seller",
  ADMIN: "/dashboard/admin",
  AGENT: "/dashboard/agent",
};

export function Header() {
  const { data: session } = useSession();
  const count = useCart((s) => s.count());
  const role = session?.user?.role ?? "BUYER";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-2xl font-black text-navy-700">
          ZEEM<span className="text-gold">.dz</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <WilayaSelect />

          <Link href="/cart" className="relative rounded-xl p-2 hover:bg-muted" aria-label="Panier">
            <ShoppingBag className="h-6 w-6 text-navy-700" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-navy-800">
                {count}
              </span>
            )}
          </Link>

          {session?.user ? (
            <Link
              href={DASHBOARD_BY_ROLE[role] ?? "/account"}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-muted"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">{session.user.name?.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
