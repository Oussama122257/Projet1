import { ListChecks } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const session = (await getSession())!;
  const jobs = await db.job.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Jobs</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Background work: scans, downloads, AI analysis, publishing, syncs.
        </p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No jobs yet"
          description="Trigger a source scan to see the async workflow in action."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-surface-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-border text-xs text-content-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Queue</th>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-surface-overlay/50">
                  <td className="px-4 py-2.5 font-mono text-xs">{j.queue}</td>
                  <td className="px-4 py-2.5 text-xs">{j.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusVariant(j.status)}>{j.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{j.attempts}</td>
                  <td className="px-4 py-2.5 text-xs text-content-tertiary">
                    {j.createdAt.toUTCString()}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-2.5 text-xs text-danger">
                    {j.error ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
