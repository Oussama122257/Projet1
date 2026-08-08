import { Header } from "@/components/site/header";
import { SupportBot } from "@/components/chat/support-bot";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="mt-12 bg-navy-700 py-8 text-center text-sm text-navy-100">
        <p className="font-bold text-white">
          ZEEM<span className="text-gold">.dz</span>
        </p>
        <p className="mt-2">
          La mode algérienne, livrée dans les 58 wilayas — paiement à la livraison.
        </p>
        <p className="mt-2 text-navy-200">© {new Date().getFullYear()} Zeem Marketplace</p>
      </footer>
      <SupportBot />
    </div>
  );
}
