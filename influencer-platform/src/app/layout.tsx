import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PayLoop — performance-verified influencer payouts",
    template: "%s · PayLoop",
  },
  description:
    "Track influencer content across TikTok, Instagram and YouTube, calculate earnings automatically, catch fraud before it costs you, and pay creators through Stripe Connect.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
};

export const viewport: Viewport = {
  themeColor: "#08090C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body
        style={
          {
            // Geist carries the headings; the body face is a neutral system
            // stack so long-form text stays quiet next to the display type.
            "--font-display": GeistSans.style.fontFamily,
            "--font-text":
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          } as React.CSSProperties
        }
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
