import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const dynamic = "force-dynamic";

/**
 * End-of-day reconciliation: cash the agent collected today vs expected.
 * The difference must be handed to the Zeem hub at day close.
 */
export default async function AgentReconciliationPage() {
  const session = await auth();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const delivered = await db.shipment.findMany({
    where: {
      agentId: session!.user.id,
      status: "DELIVERED",
      deliveredAt: { gte: dayStart },
    },
    include: { order: { select: { reference: true } } },
    orderBy: { deliveredAt: "desc" },
  });

  const expected = delivered.reduce((s, d) => s + d.codAmount, 0);
  const collected = delivered.reduce((s, d) => s + (d.actualCollected ?? d.codAmount), 0);
  const gap = collected - expected;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">Caisse du jour 💰</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 text-center">
          <p className="text-xs uppercase text-muted-foreground">Attendu</p>
          <p className="text-lg font-black text-navy-700">{formatDZD(expected)}</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-xs uppercase text-muted-foreground">Collecté</p>
          <p className="text-lg font-black text-emerald2">{formatDZD(collected)}</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-xs uppercase text-muted-foreground">Écart</p>
          <p className={`text-lg font-black ${gap === 0 ? "text-navy-700" : "text-red-600"}`}>
            {gap > 0 ? "+" : ""}{formatDZD(gap)}
          </p>
        </div>
      </div>

      <div className="glass p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Réf</TableHead>
              <TableHead>Heure</TableHead>
              <TableHead>Attendu</TableHead>
              <TableHead>Reçu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {delivered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Aucune livraison encaissée aujourd&apos;hui.
                </TableCell>
              </TableRow>
            )}
            {delivered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs font-bold">{d.order.reference}</TableCell>
                <TableCell>
                  {d.deliveredAt?.toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" })}
                </TableCell>
                <TableCell>{formatDZD(d.codAmount)}</TableCell>
                <TableCell className="font-semibold">{formatDZD(d.actualCollected ?? d.codAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Remettez le total collecté au hub Zeem avant 19h. Tout écart doit être justifié.
      </p>
    </div>
  );
}
