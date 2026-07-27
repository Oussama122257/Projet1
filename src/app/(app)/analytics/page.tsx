import { BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = (await getSession())!;

  // Latest snapshot per post, aggregated. Real data only — no fabrication.
  const snapshots = await db.postPerformance.findMany({
    where: { scheduledPost: { pipeline: { userId: session.userId } } },
    orderBy: { collectedAt: "desc" },
    take: 500,
  });

  const latestByPost = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) {
    if (!latestByPost.has(s.scheduledPostId)) latestByPost.set(s.scheduledPostId, s);
  }
  const latest = [...latestByPost.values()];
  const sum = (f: (s: (typeof latest)[number]) => number | null) =>
    latest.reduce((acc, s) => acc + (f(s) ?? 0), 0);

  const totalViews = sum((s) => s.views);
  const totalReach = sum((s) => s.reach);
  const rates = latest.map((s) => s.engagementRate).filter((r): r is number => r != null);
  const avgEngagement = rates.length
    ? (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Performance of your own destination profiles, collected via the official Metricool API.
        </p>
      </div>

      {latest.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No performance data yet"
          description="Data appears after your first posts publish and the sync worker collects real metrics (T+1h/6h/24h/72h). ContentLoop never shows fabricated numbers."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent>
              <p className="text-xs text-content-secondary">Posts measured</p>
              <p className="mt-1 text-2xl font-semibold">{latest.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-content-secondary">Total views</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totalViews)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-content-secondary">Total reach</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totalReach)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-content-secondary">Avg engagement rate</p>
              <p className="mt-1 text-2xl font-semibold">
                {avgEngagement != null ? `${avgEngagement}%` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
