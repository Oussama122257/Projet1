import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ColiShip DZ - Gestion de livraison Shopify pour l\'Algérie',
  description: 'Plateforme de gestion de livraison intégrée à Shopify avec support multi-transporteurs algériens, COD, suivi en temps réel et notifications SMS automatiques.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
