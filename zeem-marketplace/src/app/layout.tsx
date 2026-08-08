import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MetaPixel } from "@/components/meta-pixel";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Zeem.dz — Mode & Vêtements | Livraison 58 Wilayas, Paiement à la livraison",
  description:
    "Zeem Marketplace: la mode algérienne en ligne. Kaftans, robes, hijabs des meilleures boutiques locales. Paiement à la livraison (COD) partout en Algérie.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        {/* Client-side Meta Pixel — the matching server-side CAPI event fires
            on COD collection with the same eventID (deduplication). */}
        <MetaPixel />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
