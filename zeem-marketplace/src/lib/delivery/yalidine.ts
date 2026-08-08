import type { CourierAdapter, WaybillRequest, WaybillResult } from "./types";

const API_BASE = "https://api.yalidine.app/v1";

/**
 * Yalidine adapter. Real integration: POST /parcels with api-id/api-token
 * headers (https://yalidine.app developer docs). Without credentials we
 * degrade to a locally generated placeholder waybill so the full order →
 * pickup → delivery flow stays testable in dev.
 */
export const yalidine: CourierAdapter = {
  company: "YALIDINE",

  async createWaybill(req: WaybillRequest): Promise<WaybillResult> {
    const id = process.env.YALIDINE_API_ID;
    const token = process.env.YALIDINE_API_TOKEN;

    if (id && token) {
      const res = await fetch(`${API_BASE}/parcels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-ID": id,
          "X-API-TOKEN": token,
        },
        body: JSON.stringify([
          {
            order_id: req.orderReference,
            firstname: req.recipientName.split(" ")[0],
            familyname: req.recipientName.split(" ").slice(1).join(" ") || "-",
            contact_phone: req.recipientPhone.replace("+213", "0"),
            address: req.address,
            to_commune_name: req.communeName,
            to_wilaya_name: req.wilayaName,
            product_list: req.productList,
            price: req.codAmount,
            weight: req.weightKg,
            is_stopdesk: false,
            do_insurance: false,
            declared_value: req.codAmount,
            freeshipping: false,
            has_exchange: false,
          },
        ]),
      });
      if (!res.ok) throw new Error(`Yalidine API error ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as Record<string, { tracking: string; label: string }>;
      const first = Object.values(data)[0];
      return { trackingNumber: first.tracking, waybillUrl: first.label, company: "YALIDINE" };
    }

    // Dev placeholder — deterministic tracking, in-app printable waybill.
    return {
      trackingNumber: `yal-${req.shipmentId.slice(-8).toUpperCase()}`,
      waybillUrl: `/api/shipments/${req.shipmentId}/waybill`,
      company: "YALIDINE",
    };
  },

  async track(trackingNumber: string): Promise<string> {
    const id = process.env.YALIDINE_API_ID;
    const token = process.env.YALIDINE_API_TOKEN;
    if (id && token) {
      const res = await fetch(`${API_BASE}/parcels/${trackingNumber}`, {
        headers: { "X-API-ID": id, "X-API-TOKEN": token },
      });
      if (res.ok) {
        const data = (await res.json()) as { last_status?: string };
        return data.last_status ?? "unknown";
      }
    }
    return "IN_TRANSIT";
  },
};
