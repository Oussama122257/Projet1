import { Film } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const session = (await getSession())!;
  const media = await db.media.findMany({
    where: { userId: session.userId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      source: { select: { name: true } },
      analysis: { select: { contentType: true, hookType: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Content</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Global media library — every asset stored once, shared across pipelines.
        </p>
      </div>

      {media.length === 0 ? (
        <EmptyState
          icon={Film}
          title="Library is empty"
          description="Run a source scan to ingest content. New media is deduplicated, stored in the cloud, and analyzed by AI automatically."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {media.map((m) => (
            <div
              key={m.id}
              className="group overflow-hidden rounded-lg border border-surface-border bg-surface-raised"
            >
              <div className="flex aspect-video items-center justify-center bg-surface-overlay">
                <Film className="h-6 w-6 text-content-tertiary" aria-hidden />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-xs" title={m.caption ?? undefined}>
                  {m.caption ?? "No caption"}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                  {m.aiScore != null ? <Badge variant="ai">AI {m.aiScore}</Badge> : null}
                  {m.analysis?.contentType ? (
                    <Badge variant="neutral">{m.analysis.contentType}</Badge>
                  ) : null}
                </div>
                <p className="text-[11px] text-content-tertiary">
                  {m.source?.name ?? "unknown source"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
