import type { CourierAdapter, WaybillRequest, WaybillResult } from "./types";

const API_BASE = "https://procolis.com/api_v1";

/**
 * ZR Express (Procolis) adapter. Real integration uses token/key headers on
 * /add_colis. Placeholder waybill in dev without credentials.
 */
export const zrExpress: CourierAdapter = {
  company: "ZR_EXPRESS",

  async createWaybill(req: WaybillRequest): Promise<WaybillResult> {
    const token = process.env.ZR_EXPRESS_TOKEN;
    const key = process.env.ZR_EXPRESS_KEY;

    if (token && key) {
      const res = await fetch(`${API_BASE}/add_colis`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token, key },
        body: JSON.stringify({
          Colis: [
            {
              Tracking: req.orderReference,
              TypeLivraison: "0", // 0 = home delivery, 1 = stop desk
              TypeColis: "0",
              Confrimee: "1",
              Client: req.recipientName,
              MobileA: req.recipientPhone.replace("+213", "0"),
              Adresse: req.address,
              IDWilaya: String(req.wilayaCode),
              Commune: req.communeName,
              Total: String(req.codAmount),
              Note: req.productList,
              TProduit: req.productList,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`ZR Express API error ${res.status}`);
      const data = (await res.json()) as { Colis?: Array<{ Tracking: string }> };
      const tracking = data.Colis?.[0]?.Tracking ?? req.orderReference;
      return {
        trackingNumber: tracking,
        waybillUrl: `/api/shipments/${req.shipmentId}/waybill`,
        company: "ZR_EXPRESS",
      };
    }

    return {
      trackingNumber: `zr-${req.shipmentId.slice(-8).toUpperCase()}`,
      waybillUrl: `/api/shipments/${req.shipmentId}/waybill`,
      company: "ZR_EXPRESS",
    };
  },

  async track(): Promise<string> {
    return "IN_TRANSIT";
  },
};
