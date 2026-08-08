import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SellerSettingsPage() {
  const session = await auth();
  const store = await db.store.findUnique({
    where: { userId: session!.user.id },
    include: { wilaya: true },
  });
  if (!store) redirect("/register");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-700">Ma Boutique</h1>
      <div className="glass space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-navy-700">{store.name}</p>
            <p className="text-sm text-muted-foreground">zeem.dz/stores/{store.slug}</p>
          </div>
          <Badge variant={store.isActive ? "success" : "warning"}>
            {store.isActive ? "Active" : "En attente de validation"}
          </Badge>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Wilaya</dt>
            <dd className="font-semibold text-navy-700">
              {String(store.wilaya.code).padStart(2, "0")} — {store.wilaya.name}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Commune</dt>
            <dd className="font-semibold text-navy-700">{store.commune ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Commission Zeem</dt>
            <dd className="font-semibold text-navy-700">{store.commissionRate}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Description</dt>
            <dd className="font-semibold text-navy-700">{store.description ?? "—"}</dd>
          </div>
        </dl>
        <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          Pour modifier la wilaya de votre boutique ou votre registre de commerce,
          contactez l&apos;équipe Zeem — ces informations impactent le calcul des livraisons.
        </p>
      </div>
    </div>
  );
}
