import AdminSidebar from '@/components/layout/AdminSidebar';
import TopBar from '@/components/layout/TopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 md:ml-[240px]">
        <TopBar />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
