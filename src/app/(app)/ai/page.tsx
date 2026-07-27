import { Bot, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AiStudioPage() {
  const session = (await getSession())!;
  const [insights, usage] = await Promise.all([
    db.aiInsight.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.aiUsage.aggregate({
      where: { userId: session.userId },
      _sum: { inputTokens: true, outputTokens: true, estimatedCost: true },
    }),
  ]);

  const tokens = (usage._sum.inputTokens ?? 0) + (usage._sum.outputTokens ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">AI Studio</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Insights, recommendations and the assistant — always grounded in your real data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" aria-hidden /> Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No insights yet"
              description="Insights are computed from statistical aggregates of your destination performance, then interpreted by AI. They appear after enough posts have real measured data — never before, and never fabricated."
            />
          ) : (
            <ul className="space-y-3">
              {insights.map((i) => (
                <li key={i.id} className="rounded border border-surface-border p-3">
                  <p className="text-sm font-medium">{i.title}</p>
                  <p className="mt-1 text-xs text-content-secondary">{i.summary}</p>
                  <p className="mt-2 text-[11px] text-content-tertiary">
                    {i.type} · n={i.sampleSize} · confidence {i.confidence}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {tokens.toLocaleString()} tokens ·{" "}
            {(usage._sum.estimatedCost ?? 0).toFixed(4)} USD estimated
          </p>
          <p className="mt-1 text-xs text-content-tertiary">
            Every AI call is tracked per provider, model, pipeline and request type. The assistant
            chat with controlled tool access ships in Phase 7.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
