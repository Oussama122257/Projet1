"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { ConnectStatusPill, VerificationPill } from "@/components/status";
import type {
  Role,
  StripeConnectStatus,
  VerificationStatus,
} from "@prisma/client";
import { cn, formatDate } from "@/lib/utils";

type Row = {
  id: string;
  name: string | null;
  email: string;
  handle: string | null;
  image: string | null;
  role: Role;
  country: string | null;
  companyName: string | null;
  verification: VerificationStatus;
  stripeConnectedStatus: StripeConnectStatus;
  createdAt: string;
  _count: { applications: number; campaigns: number; payouts: number };
};

const ROLE_TONE = {
  BRAND: "info",
  INFLUENCER: "accent",
  ADMIN: "warning",
} as const;

const VERIFICATION_OPTIONS: VerificationStatus[] = [
  "UNVERIFIED",
  "PENDING",
  "VERIFIED",
  "SUSPENDED",
];

export function UserTable({
  users,
  activeRole,
  query,
}: {
  users: Row[];
  activeRole: string;
  query: string;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState(query);
  const [busy, setBusy] = React.useState<string | null>(null);

  // Debounced so typing doesn't fire a navigation per keystroke.
  React.useEffect(() => {
    if (search === query) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (activeRole !== "ALL") params.set("role", activeRole);
      router.push(`/admin/users${params.size ? `?${params}` : ""}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, query, activeRole, router]);

  async function setVerification(
    userId: string,
    verification: VerificationStatus
  ) {
    setBusy(userId);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, verification }),
    });
    router.refresh();
    setBusy(null);
  }

  function setRole(role: string) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (role !== "ALL") params.set("role", role);
    router.push(`/admin/users${params.size ? `?${params}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, handle or company"
            className="pl-9"
            aria-label="Search users"
          />
        </div>

        <div className="flex gap-1.5">
          {["ALL", "BRAND", "INFLUENCER", "ADMIN"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRole(role)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors",
                activeRole === role
                  ? "border-accent/40 bg-accent-muted text-accent"
                  : "border-border bg-surface-raised text-ink-secondary hover:border-ink-tertiary/40 hover:text-ink"
              )}
            >
              {role === "ALL"
                ? "All"
                : role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {users.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-ink-secondary">
          No users match &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                    User
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                    Role
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                    Payouts
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-ink-tertiary">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                    Verification
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 last:border-0 hover:bg-surface-overlay/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={row.name ?? row.email}
                          src={row.image}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">
                            {row.name ?? "—"}
                          </p>
                          <p className="truncate text-xs text-ink-tertiary">
                            {row.handle
                              ? `@${row.handle}`
                              : (row.companyName ?? row.email)}
                            {row.country && ` · ${row.country}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={ROLE_TONE[row.role]}>
                        {row.role.charAt(0) + row.role.slice(1).toLowerCase()}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {row.role === "INFLUENCER" ? (
                        <ConnectStatusPill status={row.stripeConnectedStatus} />
                      ) : (
                        <span className="text-xs text-ink-tertiary">—</span>
                      )}
                    </td>

                    <td className="tabular px-4 py-3 text-right text-xs text-ink-secondary">
                      {row.role === "BRAND"
                        ? `${row._count.campaigns} campaigns`
                        : `${row._count.applications} applications · ${row._count.payouts} payouts`}
                    </td>

                    <td className="px-4 py-3 text-xs text-ink-secondary">
                      {formatDate(row.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <VerificationPill status={row.verification} />
                        <Select
                          aria-label={`Change verification for ${row.name ?? row.email}`}
                          value={row.verification}
                          disabled={busy === row.id}
                          onChange={(e) =>
                            setVerification(
                              row.id,
                              e.target.value as VerificationStatus
                            )
                          }
                          className="h-7 w-auto text-xs"
                        >
                          {VERIFICATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option.charAt(0) + option.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
