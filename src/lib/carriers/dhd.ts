import axios, { AxiosInstance } from 'axios';
import {
  CarrierDriver,
  CarrierOrder,
  CarrierResponse,
  TrackingInfo,
  TrackingEvent,
  NormalizedStatus,
  CarrierPricing,
} from './types';

const STATUS_MAP: Record<string, NormalizedStatus> = {
  'En attente': 'pending',
  'Collecté': 'picked_up',
  'En transit': 'in_transit',
  'Au hub': 'at_hub',
  'En cours de livraison': 'out_for_delivery',
  'Livré': 'delivered',
  'Retourné': 'returned',
  'Echec': 'failed',
};

export class DHDCarrier implements CarrierDriver {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: process.env.DHD_BASE_URL || 'https://api.dhd.dz/api/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrder(order: CarrierOrder): Promise<CarrierResponse> {
    try {
      const payload = {
        client_name: order.customer_name,
        client_phone: order.customer_phone,
        client_phone2: order.customer_phone2 || '',
        client_address: order.customer_address,
        wilaya_id: order.wilaya,
        commune_id: order.commune,
        product_name: order.product_name,
        quantity: order.quantity,
        price: order.is_cod ? order.cod_amount || order.price : 0,
        weight: order.weight || 0.5,
        note: order.note || '',
        reference: order.external_id || '',
      };

      const { data } = await this.client.post('/orders', payload);

      return {
        success: !!data.data?.tracking_id,
        tracking_id: data.data?.tracking_id,
        label_url: data.data?.label_url,
        raw: data,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `DHD error: ${message}` };
    }
  }

  async createBulkOrders(orders: CarrierOrder[]): Promise<CarrierResponse[]> {
    const results: CarrierResponse[] = [];
    for (const order of orders) {
      results.push(await this.createOrder(order));
    }
    return results;
  }

  async getTracking(trackingId: string): Promise<TrackingInfo> {
    const { data } = await this.client.get(`/orders/tracking/${trackingId}`);

    const events: TrackingEvent[] = (data.data?.history || []).map(
      (event: { status: string; created_at: string; note?: string }) => ({
        status: event.status,
        description: event.note || event.status,
        timestamp: event.created_at,
      })
    );

    return {
      tracking_id: trackingId,
      status: data.data?.status || 'Unknown',
      normalized_status: STATUS_MAP[data.data?.status] || 'pending',
      timestamp: data.data?.updated_at || new Date().toISOString(),
      events,
    };
  }

  async getLabel(trackingId: string): Promise<string> {
    const { data } = await this.client.get(`/orders/${trackingId}/label`);
    return data.data?.url || '';
  }

  async getBordereau(trackingIds: string[]): Promise<string> {
    const { data } = await this.client.post('/orders/bordereau', { tracking_ids: trackingIds });
    return data.data?.url || '';
  }

  async getPricing(): Promise<CarrierPricing[]> {
    const { data } = await this.client.get('/delivery-fees');
    return (data.data || []).map(
      (fee: { wilaya: string; home: number; stopdesk: number }) => ({
        wilaya_from: 'Algiers',
        wilaya_to: fee.wilaya,
        desk_price: fee.stopdesk,
        home_price: fee.home,
      })
    );
  }

  async cancelOrder(trackingId: string): Promise<CarrierResponse> {
    try {
      const { data } = await this.client.post(`/orders/${trackingId}/cancel`);
      return { success: !!data.success, tracking_id: trackingId, raw: data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Cancel error: ${message}` };
    }
  }
}
