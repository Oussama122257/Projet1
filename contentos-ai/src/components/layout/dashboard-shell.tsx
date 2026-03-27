"use client";

import { Sidebar } from "./sidebar";
import { Toaster } from "sonner";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="md:pl-64 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-6 md:p-8">{children}</div>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
