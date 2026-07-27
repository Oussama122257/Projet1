import { Film, Radio, Sparkles, Workflow } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const userId = session.userId;

  const [pipelines, sourceCount, mediaCount, readyCount, upcoming, insights] = await Promise.all([
    db.pipeline.findMany({
      where: { userId, status: { not: "ARCHIVED" } },
      include: { _count: { select: { pipelineMedia: true } } },
      take: 8,
    }),
    db.source.count({ where: { userId, status: { not: "ARCHIVED" } } }),
    db.media.count({ where: { userId } }),
    db.media.count({ where: { userId, status: "READY" } }),
    db.scheduledPost.findMany({
      where: {
        pipeline: { userId },
        publishAt: { gte: new Date() },
        status: { in: ["QUEUED", "PENDING_APPROVAL", "SENT_TO_METRICOOL"] },
      },
      orderBy: { publishAt: "asc" },
      take: 5,
      include: { pipeline: { select: { name: true } }, media: { select: { caption: true } } },
    }),
    db.aiInsight.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const kpis = [
    { label: "Active pipelines", value: pipelines.filter((p) => p.status === "ACTIVE").length },
    { label: "Sources", value: sourceCount },
    { label: "Media in library", value: mediaCount },
    { label: "Ready to publish", value: readyCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-content-secondary">
          What should you publish next — and why.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent>
              <p className="text-xs text-content-secondary">{kpi.label}</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(kpi.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline health</CardTitle>
          </CardHeader>
          <CardContent>
            {pipelines.length === 0 ? (
              <EmptyState
                icon={Workflow}
                title="No pipelines yet"
                description="Create your first pipeline to route sources to a destination."
              />
            ) : (
              <ul className="space-y-2">
                {pipelines.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded border border-surface-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-content-tertiary">
                        {p._count.pipelineMedia} items in pool · goal {p.goal.toLowerCase()}
                      </p>
                    </div>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming posts</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={Film}
                title="Nothing scheduled"
                description="Once a pipeline has a schedule and content, upcoming posts appear here."
              />
            ) : (
              <ul className="space-y-2">
                {upcoming.map((post) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between rounded border border-surface-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{post.media.caption ?? "Untitled media"}</p>
                      <p className="text-xs text-content-tertiary">
                        {post.pipeline.name} · {post.publishAt.toUTCString()}
                      </p>
                    </div>
                    <Badge variant={statusVariant(post.status)}>{post.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-ai/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" aria-hidden /> AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-sm text-content-secondary">
              No insights yet. Insights are generated from your <em>actual</em> destination
              performance data — connect Metricool and publish through a pipeline to start the
              learning loop. ContentLoop never fabricates performance findings.
            </p>
          ) : (
            <ul className="space-y-3">
              {insights.map((i) => (
                <li key={i.id} className="rounded border border-surface-border p-3">
                  <p className="text-sm font-medium">{i.title}</p>
                  <p className="mt-1 text-xs text-content-secondary">{i.summary}</p>
                  <p className="mt-2 text-[11px] text-content-tertiary">
                    Based on {i.sampleSize} posts · Confidence: {i.confidence}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {sourceCount === 0 ? (
        <EmptyState
          icon={Radio}
          title="Start by adding an authorized source"
          description="Add a source profile you own or have permission to reuse, then assign it to a pipeline."
        />
      ) : null}
    </div>
  );
}
