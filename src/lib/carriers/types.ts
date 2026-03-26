export interface CarrierOrder {
  tracking_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_phone2?: string;
  customer_address: string;
  wilaya: string;
  commune: string;
  product_name: string;
  quantity: number;
  price: number;
  is_cod: boolean;
  cod_amount?: number;
  weight?: number;
  is_express?: boolean;
  note?: string;
  external_id?: string;
}

export interface CarrierResponse {
  success: boolean;
  tracking_id?: string;
  label_url?: string;
  bordereau_url?: string;
  error?: string;
  raw?: unknown;
}

export interface TrackingInfo {
  tracking_id: string;
  status: string;
  normalized_status: NormalizedStatus;
  location?: string;
  timestamp: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export type NormalizedStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'at_hub'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'failed'
  | 'cancelled';

export interface CarrierPricing {
  wilaya_from: string;
  wilaya_to: string;
  desk_price: number;
  home_price: number;
  express_desk_price?: number;
  express_home_price?: number;
}

export interface CarrierDriver {
  createOrder(order: CarrierOrder): Promise<CarrierResponse>;
  createBulkOrders(orders: CarrierOrder[]): Promise<CarrierResponse[]>;
  getTracking(trackingId: string): Promise<TrackingInfo>;
  getLabel(trackingId: string): Promise<string>;
  getBordereau(trackingIds: string[]): Promise<string>;
  getPricing(fromWilaya?: string): Promise<CarrierPricing[]>;
  cancelOrder(trackingId: string): Promise<CarrierResponse>;
}
