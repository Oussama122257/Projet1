import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "AdPilot - AI Campaign Analytics",
  description: "AI-powered multi-platform campaign analytics and optimization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-[240px]">
            <TopBar />
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
