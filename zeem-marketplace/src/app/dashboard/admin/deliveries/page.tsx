import { db } from "@/lib/db";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DeliveryToggle } from "./delivery-toggle";
import { formatDZD } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COMPANIES = [
  { key: "YALIDINE", label: "Yalidine" },
  { key: "ZR_EXPRESS", label: "ZR Express" },
  { key: "POSTE", label: "Algérie Poste" },
] as const;

/** Delivery Management: per-courier coverage — toggle wilayas on/off. */
export default async function AdminDeliveriesPage() {
  const deliveries = await db.delivery.findMany({
    include: { wilaya: true },
    orderBy: { wilaya: { code: "asc" } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">Sociétés de livraison</h1>
      <p className="text-sm text-muted-foreground">
        Activez/désactivez chaque transporteur par wilaya. Le checkout choisit
        automatiquement le transporteur actif le moins cher.
      </p>

      <Tabs defaultValue="YALIDINE">
        <TabsList>
          {COMPANIES.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
        {COMPANIES.map((c) => (
          <TabsContent key={c.key} value={c.key}>
            <div className="glass p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wilaya</TableHead>
                    <TableHead>Domicile</TableHead>
                    <TableHead>Stop-desk</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries
                    .filter((d) => d.company === c.key)
                    .map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          {String(d.wilaya.code).padStart(2, "0")} — {d.wilaya.name}
                        </TableCell>
                        <TableCell>{formatDZD(d.homeFee)}</TableCell>
                        <TableCell>{formatDZD(d.deskFee)}</TableCell>
                        <TableCell>
                          <DeliveryToggle id={d.id} isActive={d.isActive} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
