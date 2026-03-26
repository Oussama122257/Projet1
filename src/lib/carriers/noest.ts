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
  'new': 'pending',
  'picked_up': 'picked_up',
  'in_transit': 'in_transit',
  'at_center': 'at_hub',
  'delivering': 'out_for_delivery',
  'delivered': 'delivered',
  'returned': 'returned',
  'failed': 'failed',
  'cancelled': 'cancelled',
};

export class NoestCarrier implements CarrierDriver {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: process.env.NOEST_BASE_URL || 'https://api.noest.dz/api/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrder(order: CarrierOrder): Promise<CarrierResponse> {
    try {
      const payload = {
        recipient_name: order.customer_name,
        recipient_phone: order.customer_phone,
        recipient_address: order.customer_address,
        wilaya: order.wilaya,
        commune: order.commune,
        product: order.product_name,
        quantity: order.quantity,
        amount: order.is_cod ? order.cod_amount || order.price : 0,
        weight: order.weight || 0.5,
        note: order.note || '',
        reference: order.external_id || '',
        type: order.is_express ? 'express' : 'normal',
      };

      const { data } = await this.client.post('/parcels', payload);

      return {
        success: !!data.tracking_number,
        tracking_id: data.tracking_number,
        label_url: data.label,
        raw: data,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Noest error: ${message}` };
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
    const { data } = await this.client.get(`/parcels/${trackingId}/tracking`);

    const events: TrackingEvent[] = (data.events || []).map(
      (event: { status: string; description: string; date: string; location?: string }) => ({
        status: event.status,
        description: event.description,
        location: event.location,
        timestamp: event.date,
      })
    );

    return {
      tracking_id: trackingId,
      status: data.current_status || 'Unknown',
      normalized_status: STATUS_MAP[data.current_status] || 'pending',
      timestamp: data.updated_at || new Date().toISOString(),
      events,
    };
  }

  async getLabel(trackingId: string): Promise<string> {
    const { data } = await this.client.get(`/parcels/${trackingId}/label`);
    return data.url || '';
  }

  async getBordereau(trackingIds: string[]): Promise<string> {
    const { data } = await this.client.post('/parcels/bordereau', { trackings: trackingIds });
    return data.url || '';
  }

  async getPricing(): Promise<CarrierPricing[]> {
    const { data } = await this.client.get('/fees');
    return (data || []).map(
      (fee: { wilaya: string; home: number; desk: number }) => ({
        wilaya_from: 'Algiers',
        wilaya_to: fee.wilaya,
        desk_price: fee.desk,
        home_price: fee.home,
      })
    );
  }

  async cancelOrder(trackingId: string): Promise<CarrierResponse> {
    try {
      const { data } = await this.client.post(`/parcels/${trackingId}/cancel`);
      return { success: !!data.success, tracking_id: trackingId, raw: data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Cancel error: ${message}` };
    }
  }
}
