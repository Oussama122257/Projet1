import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { UserTable } from "@/components/admin/user-table";
import { prisma, Role } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roleFilter = searchParams.role?.toUpperCase();
  const query = searchParams.q?.trim();

  const users = await prisma.user.findMany({
    where: {
      ...(roleFilter && roleFilter in Role ? { role: roleFilter as Role } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
              { handle: { contains: query, mode: "insensitive" as const } },
              { companyName: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      handle: true,
      image: true,
      role: true,
      country: true,
      companyName: true,
      verification: true,
      stripeConnectedStatus: true,
      createdAt: true,
      _count: { select: { applications: true, campaigns: true, payouts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Everyone on the platform, with verification status you can change and payout readiness at a glance."
      />

      <div className="mt-6">
        {users.length === 0 && !query ? (
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Brands and creators appear here as soon as they register."
          />
        ) : (
          <UserTable
            users={users.map((u) => ({
              ...u,
              createdAt: u.createdAt.toISOString(),
            }))}
            activeRole={roleFilter ?? "ALL"}
            query={query ?? ""}
          />
        )}
      </div>
    </PageBody>
  );
}
