import { DeliveryCompany } from "@prisma/client";

export interface WaybillRequest {
  shipmentId: string;
  orderReference: string;
  recipientName: string;
  recipientPhone: string; // +213…
  wilayaName: string;
  wilayaCode: number;
  communeName: string;
  address: string;
  codAmount: number; // DZD to collect on delivery
  weightKg: number;
  productList: string; // "2x Kaftan Royal, 1x Hijab Soie"
}

export interface WaybillResult {
  trackingNumber: string;
  waybillUrl: string; // printable label PDF
  company: DeliveryCompany;
}

export interface CourierAdapter {
  company: DeliveryCompany;
  /** Create the shipment on the courier's system and get a waybill. */
  createWaybill(req: WaybillRequest): Promise<WaybillResult>;
  /** Poll tracking status (raw courier status string). */
  track(trackingNumber: string): Promise<string>;
}
