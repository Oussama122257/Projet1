import { redirect } from "next/navigation";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { prisma, ApplicationStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export default async function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Pending applicants are the brand's action item, so the count rides the nav.
  const pendingApplicants = await prisma.influencerApplication.count({
    where: {
      status: ApplicationStatus.PENDING,
      campaign: { brandId: user.id },
    },
  });

  const nav: NavItem[] = [
    { href: "/brand", label: "Overview", icon: "dashboard" },
    { href: "/brand/campaigns", label: "Campaigns", icon: "campaigns" },
    {
      href: "/brand/applicants",
      label: "Applicants",
      icon: "applicants",
      badge: pendingApplicants,
    },
    { href: "/brand/spend", label: "Spend", icon: "wallet" },
  ];

  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
