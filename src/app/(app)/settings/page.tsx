import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = (await getSession())!;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      email: true,
      name: true,
      plan: true,
      allowAiAnalysis: true,
      allowAiPerformance: true,
      allowAiCaptions: true,
      allowAiRecommendations: true,
      preferredAiProvider: true,
    },
  });
  if (!user) return null;

  const consents = [
    { label: "Allow AI content analysis", value: user.allowAiAnalysis },
    { label: "Allow performance data analysis", value: user.allowAiPerformance },
    { label: "Allow AI captions", value: user.allowAiCaptions },
    { label: "Allow AI recommendations", value: user.allowAiRecommendations },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-content-secondary">Account, plan and AI data settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-content-tertiary">Name</dt>
            <dd>{user.name}</dd>
            <dt className="text-content-tertiary">Email</dt>
            <dd>{user.email}</dd>
            <dt className="text-content-tertiary">Plan</dt>
            <dd>
              <Badge variant="accent">{user.plan}</Badge>
            </dd>
            <dt className="text-content-tertiary">Preferred AI provider</dt>
            <dd>{user.preferredAiProvider ?? "platform default"}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI data settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-content-secondary">
            These switches control exactly which data categories are sent to AI providers. The
            platform minimizes external data by design: derived signals and statistical
            aggregates only — never credentials, tokens or raw database rows.
          </p>
          <ul className="space-y-2">
            {consents.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between rounded border border-surface-border px-3 py-2 text-sm"
              >
                {c.label}
                <Badge variant={c.value ? "success" : "neutral"}>
                  {c.value ? "Enabled" : "Disabled"}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-content-tertiary">
            Editable toggles ship with the settings API in Phase 2; workers already enforce these
            flags before any AI call.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
