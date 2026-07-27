import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricoolForm } from "./metricool-form";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = (await getSession())!;
  const connections = await db.metricoolConnection.findMany({
    where: { userId: session.userId, status: { not: "DISCONNECTED" } },
    select: { id: true, metricoolUserId: true, status: true, lastCheckedAt: true },
  });

  const apifyConfigured = Boolean(env().APIFY_API_TOKEN && env().APIFY_ACTOR_ID);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Integrations</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Official APIs only: Apify for ingestion, Metricool for publishing & analytics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apify (ingestion)</CardTitle>
          <Badge variant={apifyConfigured ? "success" : "warning"}>
            {apifyConfigured ? "Configured" : "Not configured"}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-content-secondary">
            Configured server-side via <code className="font-mono">APIFY_API_TOKEN</code> and{" "}
            <code className="font-mono">APIFY_ACTOR_ID</code>. The token never leaves the server.
            Consult your chosen Actor&apos;s documented input schema and set{" "}
            <code className="font-mono">APIFY_INPUT_TEMPLATE</code> accordingly.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metricool (publishing & analytics)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections.length > 0 ? (
            <ul className="space-y-2">
              {connections.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded border border-surface-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm">Metricool user {c.metricoolUserId}</p>
                    <p className="text-xs text-content-tertiary">
                      Last checked: {c.lastCheckedAt?.toUTCString() ?? "never"}
                    </p>
                  </div>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          <MetricoolForm />
        </CardContent>
      </Card>
    </div>
  );
}
