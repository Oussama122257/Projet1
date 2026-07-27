import { Beaker } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ExperimentsPage() {
  const session = (await getSession())!;
  const experiments = await db.experiment.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { pipeline: { select: { name: true } }, variants: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Experiments</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Controlled A/B tests — one variable at a time, winners only with sufficient sample size.
        </p>
      </div>
      {experiments.length === 0 ? (
        <EmptyState
          icon={Beaker}
          title="No experiments yet"
          description="The experiment designer (with AI-proposed hypotheses grounded in your real performance data) ships in Phase 6. The data model and analysis methodology are already in place."
        />
      ) : (
        <ul className="space-y-2">
          {experiments.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-surface-border bg-surface-raised px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{e.name}</p>
                <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-content-secondary">{e.hypothesis}</p>
              <p className="mt-1 text-[11px] text-content-tertiary">
                {e.pipeline.name} · variable {e.variable} · metric {e.primaryMetric} ·{" "}
                {e.variants.length} variants
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
