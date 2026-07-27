import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ContentLoop", template: "%s · ContentLoop" },
  description: "AI-powered content operating system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
