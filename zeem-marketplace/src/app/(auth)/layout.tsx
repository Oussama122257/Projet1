import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-700 px-4 py-10">
      <Link href="/" className="mb-8 text-3xl font-black text-white">
        ZEEM<span className="text-gold">.dz</span>
      </Link>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-glass">{children}</div>
    </div>
  );
}
