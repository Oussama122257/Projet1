import { Radio } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ScanButton, SourceForm } from "./source-form";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const session = (await getSession())!;
  const sources = await db.source.findMany({
    where: { userId: session.userId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      pipelineSources: { include: { pipeline: { select: { id: true, name: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Sources</h1>
          <p className="mt-1 text-sm text-content-secondary">
            Authorized source profiles. One scan feeds every pipeline using the source.
          </p>
        </div>
        <SourceForm />
      </div>

      {sources.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No sources yet"
          description="Add a profile you own or are explicitly permitted to reuse. You must confirm reuse rights before any scan runs."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-surface-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-border text-xs text-content-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Last scan</th>
                <th className="px-4 py-3 font-medium">Found / Imported</th>
                <th className="px-4 py-3 font-medium">Pipelines</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-surface-overlay/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.name}</p>
                    <p className="max-w-[220px] truncate text-xs text-content-tertiary">{s.url}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-content-secondary">
                    every {Math.round(s.monitoringFrequencyMins / 60)}h
                  </td>
                  <td className="px-4 py-3 text-xs text-content-secondary">
                    {s.lastScanAt ? s.lastScanAt.toUTCString() : "never"}
                  </td>
                  <td className="px-4 py-3 text-xs text-content-secondary">
                    {s.videosFound} / {s.videosImported}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.pipelineSources.length === 0 ? (
                        <span className="text-xs text-content-tertiary">unassigned</span>
                      ) : (
                        s.pipelineSources.map((ps) => (
                          <Badge key={ps.pipeline.id} variant="accent">
                            {ps.pipeline.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ScanButton sourceId={s.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
