import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdPilot - AI-Powered Ad Optimization Platform",
  description: "AI that learns from your ads. Optimize campaigns across Google, Meta, TikTok, and Snapchat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
