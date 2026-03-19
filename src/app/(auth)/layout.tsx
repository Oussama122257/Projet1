import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-[240px]">
        <TopBar />
        <main className="p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
