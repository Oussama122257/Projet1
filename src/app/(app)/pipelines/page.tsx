import { Workflow } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PipelineForm } from "./pipeline-form";

export const dynamic = "force-dynamic";

export default async function PipelinesPage() {
  const session = (await getSession())!;
  const [pipelines, sources] = await Promise.all([
    db.pipeline.findMany({
      where: { userId: session.userId, status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
      include: {
        pipelineSources: { include: { source: { select: { id: true, name: true } } } },
        destination: { select: { network: true, displayName: true } },
        schedule: { select: { postsPerDay: true, active: true } },
        _count: { select: { pipelineMedia: true, scheduledPosts: true } },
      },
    }),
    db.source.findMany({
      where: { userId: session.userId, status: "ACTIVE" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Pipelines</h1>
          <p className="mt-1 text-sm text-content-secondary">
            Independent content routes: sources → pool → schedule → destination. One pipeline
            failing never stops another.
          </p>
        </div>
        <PipelineForm sources={sources} />
      </div>

      {pipelines.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No pipelines yet"
          description="Create a pipeline to group sources, score content with AI, and publish on a schedule."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pipelines.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <dt className="text-content-tertiary">Goal</dt>
                  <dd>{p.goal.toLowerCase()}</dd>
                  <dt className="text-content-tertiary">Timezone</dt>
                  <dd>{p.timezone}</dd>
                  <dt className="text-content-tertiary">Content pool</dt>
                  <dd>{p._count.pipelineMedia} items</dd>
                  <dt className="text-content-tertiary">Posts</dt>
                  <dd>{p._count.scheduledPosts}</dd>
                  <dt className="text-content-tertiary">Destination</dt>
                  <dd>
                    {p.destination
                      ? `${p.destination.displayName ?? p.destination.network}`
                      : "not connected"}
                  </dd>
                  <dt className="text-content-tertiary">Schedule</dt>
                  <dd>
                    {p.schedule
                      ? `${p.schedule.postsPerDay}/day ${p.schedule.active ? "" : "(paused)"}`
                      : "none"}
                  </dd>
                  <dt className="text-content-tertiary">Autopilot</dt>
                  <dd>{p.autopilotMode}</dd>
                </dl>
                <div className="flex flex-wrap gap-1 border-t border-surface-border pt-3">
                  {p.pipelineSources.length === 0 ? (
                    <span className="text-xs text-content-tertiary">No sources attached</span>
                  ) : (
                    p.pipelineSources.map((ps) => (
                      <Badge key={ps.source.id} variant="neutral">
                        {ps.source.name}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
