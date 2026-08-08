import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const dynamic = "force-dynamic";

/**
 * Pixel Manager: live audit log of every server-side event sent to Meta CAPI
 * (Purchase on COD collection, replays, failures with error detail).
 */
export default async function AdminPixelsPage() {
  const logs = await db.pixelEventLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const configured = !!process.env.NEXT_PUBLIC_META_PIXEL_ID && !!process.env.META_CAPI_ACCESS_TOKEN;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">Pixel Manager</h1>
      <div className="glass flex items-center justify-between p-4 text-sm">
        <span>
          Pixel Meta:{" "}
          <span className="font-mono font-bold">{process.env.NEXT_PUBLIC_META_PIXEL_ID || "non configuré"}</span>
        </span>
        <Badge variant={configured ? "success" : "warning"}>
          {configured ? "CAPI actif" : "CAPI non configuré"}
        </Badge>
      </div>

      <div className="glass p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Événement</TableHead>
              <TableHead>Event ID (dédup)</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Erreur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Les événements serveur (Purchase à l&apos;encaissement COD) apparaîtront ici.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {log.createdAt.toLocaleString("fr-DZ")}
                </TableCell>
                <TableCell className="font-semibold">{log.eventName}</TableCell>
                <TableCell className="font-mono text-xs">{log.eventId}</TableCell>
                <TableCell>
                  <Badge
                    variant={log.status === "SENT" ? "success" : log.status === "FAILED" ? "destructive" : "warning"}
                  >
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-xs text-red-600">{log.error ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
