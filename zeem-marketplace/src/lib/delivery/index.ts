import { DeliveryCompany } from "@prisma/client";
import type { CourierAdapter } from "./types";
import { yalidine } from "./yalidine";
import { zrExpress } from "./zr-express";
import { algeriePoste } from "./algerie-poste";

const adapters: Record<DeliveryCompany, CourierAdapter> = {
  YALIDINE: yalidine,
  ZR_EXPRESS: zrExpress,
  POSTE: algeriePoste,
};

export function courierFor(company: DeliveryCompany): CourierAdapter {
  return adapters[company];
}

export type { WaybillRequest, WaybillResult } from "./types";
