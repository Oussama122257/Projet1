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
  'pending': 'pending',
  'collected': 'picked_up',
  'transit': 'in_transit',
  'hub': 'at_hub',
  'delivering': 'out_for_delivery',
  'delivered': 'delivered',
  'returned': 'returned',
  'failed': 'failed',
};

export class EcotrackCarrier implements CarrierDriver {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: process.env.ECOTRACK_BASE_URL || 'https://api.ecotrack.dz/api/v1',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrder(order: CarrierOrder): Promise<CarrierResponse> {
    try {
      const payload = {
        name: order.customer_name,
        phone: order.customer_phone,
        address: order.customer_address,
        wilaya: order.wilaya,
        commune: order.commune,
        product: order.product_name,
        qty: order.quantity,
        price: order.is_cod ? order.cod_amount || order.price : 0,
        weight: order.weight || 0.5,
        note: order.note || '',
        ref: order.external_id || '',
      };

      const { data } = await this.client.post('/shipments', payload);

      return {
        success: !!data.tracking,
        tracking_id: data.tracking,
        label_url: data.label,
        raw: data,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Ecotrack error: ${message}` };
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
    const { data } = await this.client.get(`/shipments/${trackingId}/tracking`);

    const events: TrackingEvent[] = (data.timeline || []).map(
      (event: { status: string; message: string; date: string }) => ({
        status: event.status,
        description: event.message,
        timestamp: event.date,
      })
    );

    return {
      tracking_id: trackingId,
      status: data.status || 'Unknown',
      normalized_status: STATUS_MAP[data.status] || 'pending',
      timestamp: data.updated_at || new Date().toISOString(),
      events,
    };
  }

  async getLabel(trackingId: string): Promise<string> {
    const { data } = await this.client.get(`/shipments/${trackingId}/label`);
    return data.url || '';
  }

  async getBordereau(trackingIds: string[]): Promise<string> {
    const { data } = await this.client.post('/shipments/bordereau', { ids: trackingIds });
    return data.url || '';
  }

  async getPricing(): Promise<CarrierPricing[]> {
    const { data } = await this.client.get('/pricing');
    return (data || []).map(
      (p: { wilaya: string; home: number; desk: number }) => ({
        wilaya_from: 'Algiers',
        wilaya_to: p.wilaya,
        desk_price: p.desk,
        home_price: p.home,
      })
    );
  }

  async cancelOrder(trackingId: string): Promise<CarrierResponse> {
    try {
      const { data } = await this.client.delete(`/shipments/${trackingId}`);
      return { success: !!data.success, tracking_id: trackingId, raw: data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Cancel error: ${message}` };
    }
  }
}
