import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";

/**
 * GET  /api/shipments/:id/waybill — printable HTML waybill (bordereau).
 * Used as the label for couriers without an API (Algérie Poste) and as the
 * dev placeholder for Yalidine/ZR Express.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shipment = await db.shipment.findUnique({
    where: { id },
    include: {
      seller: { include: { wilaya: true } },
      order: {
        include: {
          shippingAddress: { include: { wilaya: true, commune: true } },
          items: { include: { product: true } },
        },
      },
    },
  });
  if (!shipment) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const addr = shipment.order.shippingAddress;
  const items = shipment.order.items.filter((i) => i.sellerId === shipment.sellerId);

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Bordereau ${shipment.order.reference}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:640px;margin:24px auto;padding:0 16px;color:#0A2647}
  .box{border:2px solid #0A2647;border-radius:12px;padding:20px;margin-bottom:16px}
  h1{font-size:20px;display:flex;justify-content:space-between}
  h1 .gold{color:#B08418}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}
  .cod{font-size:26px;font-weight:800;color:#B08418;text-align:center;padding:12px;border:3px dashed #B08418;border-radius:12px}
  .muted{color:#666;font-size:12px}
  @media print{.noprint{display:none}}
</style></head><body>
<div class="box">
  <h1><span>ZEEM<span class="gold">.dz</span></span><span>${shipment.deliveryCompany}</span></h1>
  <p><strong>Commande:</strong> ${shipment.order.reference} &nbsp; <strong>Suivi:</strong> ${shipment.trackingNumber ?? "—"}</p>
  <p><strong>Expéditeur:</strong> ${shipment.seller.name} — ${shipment.seller.wilaya.name}</p>
  <p><strong>Destinataire:</strong> ${addr?.fullName ?? "—"} — ${addr?.phone ?? ""}<br>
  ${addr ? `${addr.streetAddress}, ${addr.commune.name}, ${addr.wilaya.name} (${String(addr.wilaya.code).padStart(2, "0")})` : ""}</p>
</div>
<div class="box">
  <table><tr><th>Article</th><th>Qté</th><th>Prix</th></tr>
  ${items.map((i) => `<tr><td>${i.product.name}${i.size ? ` (${i.size})` : ""}</td><td>${i.quantity}</td><td>${formatDZD(i.price * i.quantity)}</td></tr>`).join("")}
  <tr><td colspan="2"><strong>Livraison</strong></td><td>${formatDZD(shipment.shippingFee)}</td></tr>
  </table>
</div>
<div class="cod">MONTANT À ENCAISSER (COD): ${formatDZD(shipment.codAmount)}</div>
<p class="muted">Paiement à la livraison — le destinataire paie en espèces avant ouverture du colis.</p>
<button class="noprint" onclick="window.print()">🖨 Imprimer</button>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
