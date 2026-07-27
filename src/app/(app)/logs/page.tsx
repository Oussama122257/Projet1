import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const session = (await getSession())!;
  const logs = await db.log.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Logs</h1>
        <p className="mt-1 text-sm text-content-secondary">Recent application events.</p>
      </div>
      {logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No log entries"
          description="Workflow events (scan results, publish outcomes, budget warnings) appear here."
        />
      ) : (
        <ul className="space-y-1 font-mono text-xs">
          {logs.map((l) => (
            <li
              key={l.id}
              className="flex gap-3 rounded border border-surface-border bg-surface-raised px-3 py-2"
            >
              <span className="text-content-tertiary">{l.createdAt.toISOString()}</span>
              <span
                className={
                  l.level === "error"
                    ? "text-danger"
                    : l.level === "warn"
                      ? "text-warning"
                      : "text-content-secondary"
                }
              >
                {l.level.toUpperCase()}
              </span>
              <span className="text-content-tertiary">[{l.scope}]</span>
              <span className="text-content-primary">{l.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
