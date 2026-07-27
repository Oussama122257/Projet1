import { Calendar } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = (await getSession())!;
  const posts = await db.scheduledPost.findMany({
    where: { pipeline: { userId: session.userId }, publishAt: { gte: new Date() } },
    orderBy: { publishAt: "asc" },
    take: 50,
    include: { pipeline: { select: { name: true } }, media: { select: { caption: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Calendar</h1>
        <p className="mt-1 text-sm text-content-secondary">Upcoming scheduled posts.</p>
      </div>
      {posts.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nothing scheduled"
          description="Posts appear here once a pipeline schedule picks content, or when you schedule manually. Full week/month calendar view ships in Phase 4."
        />
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{p.media.caption ?? "Untitled media"}</p>
                <p className="text-xs text-content-tertiary">
                  {p.pipeline.name} · {p.publishAt.toUTCString()}
                </p>
              </div>
              <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
