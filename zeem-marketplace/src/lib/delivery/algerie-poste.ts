import type { CourierAdapter, WaybillRequest, WaybillResult } from "./types";

/**
 * Algérie Poste (EMS / Colis postal) adapter.
 * No public REST API is generally available — this placeholder generates an
 * internal waybill; ops teams drop parcels at the post office with the
 * printed label. Swap in the official integration when credentials exist.
 */
export const algeriePoste: CourierAdapter = {
  company: "POSTE",

  async createWaybill(req: WaybillRequest): Promise<WaybillResult> {
    return {
      trackingNumber: `ap-${req.shipmentId.slice(-8).toUpperCase()}`,
      waybillUrl: `/api/shipments/${req.shipmentId}/waybill`,
      company: "POSTE",
    };
  },

  async track(): Promise<string> {
    return "IN_TRANSIT";
  },
};
