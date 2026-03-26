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

const STATUS_MAP: Record<number, NormalizedStatus> = {
  1: 'pending',
  2: 'picked_up',
  3: 'in_transit',
  4: 'at_hub',
  5: 'out_for_delivery',
  6: 'delivered',
  7: 'returned',
  8: 'failed',
  9: 'cancelled',
};

export class MaystroCarrier implements CarrierDriver {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: process.env.MAYSTRO_BASE_URL || 'https://api.maystro-delivery.com/api/v1',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrder(order: CarrierOrder): Promise<CarrierResponse> {
    try {
      const payload = {
        name: order.customer_name,
        phone: order.customer_phone,
        phone_2: order.customer_phone2 || '',
        address: order.customer_address,
        wilaya: order.wilaya,
        commune: order.commune,
        product: order.product_name,
        quantity: order.quantity,
        price: order.is_cod ? order.cod_amount || order.price : 0,
        weight: order.weight || 0.5,
        note: order.note || '',
        external_id: order.external_id || '',
        delivery_type: order.is_express ? 'EXPRESS' : 'NORMAL',
        is_free_delivery: !order.is_cod,
      };

      const { data } = await this.client.post('/parcels/', payload);

      return {
        success: true,
        tracking_id: data.tracking_code || data.id?.toString(),
        label_url: data.label_url,
        raw: data,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Maystro error: ${message}` };
    }
  }

  async createBulkOrders(orders: CarrierOrder[]): Promise<CarrierResponse[]> {
    try {
      const payloads = orders.map((order) => ({
        name: order.customer_name,
        phone: order.customer_phone,
        address: order.customer_address,
        wilaya: order.wilaya,
        commune: order.commune,
        product: order.product_name,
        quantity: order.quantity,
        price: order.is_cod ? order.cod_amount || order.price : 0,
        weight: order.weight || 0.5,
        note: order.note || '',
        external_id: order.external_id || '',
      }));

      const { data } = await this.client.post('/parcels/bulk/', payloads);

      return (data.results || data).map(
        (result: { tracking_code?: string; id?: number; error?: string }) => ({
          success: !!result.tracking_code || !!result.id,
          tracking_id: result.tracking_code || result.id?.toString(),
          error: result.error,
          raw: result,
        })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return orders.map(() => ({ success: false, error: `Maystro bulk error: ${message}` }));
    }
  }

  async getTracking(trackingId: string): Promise<TrackingInfo> {
    const { data } = await this.client.get(`/parcels/tracking/${trackingId}/`);

    const events: TrackingEvent[] = (data.history || []).map(
      (event: { status: number; status_label: string; date: string; note?: string }) => ({
        status: event.status_label,
        description: event.note || event.status_label,
        timestamp: event.date,
      })
    );

    return {
      tracking_id: trackingId,
      status: data.status_label || 'Unknown',
      normalized_status: STATUS_MAP[data.status] || 'pending',
      timestamp: data.updated_at || new Date().toISOString(),
      events,
    };
  }

  async getLabel(trackingId: string): Promise<string> {
    const { data } = await this.client.get(`/parcels/${trackingId}/label/`);
    return data.url || '';
  }

  async getBordereau(trackingIds: string[]): Promise<string> {
    const { data } = await this.client.post('/parcels/bordereau/', {
      tracking_codes: trackingIds,
    });
    return data.url || '';
  }

  async getPricing(): Promise<CarrierPricing[]> {
    const { data } = await this.client.get('/delivery-fees/');
    return (data.results || data || []).map(
      (fee: { wilaya_name: string; home_delivery: number; stopdesk_delivery: number }) => ({
        wilaya_from: 'Algiers',
        wilaya_to: fee.wilaya_name,
        desk_price: fee.stopdesk_delivery,
        home_price: fee.home_delivery,
      })
    );
  }

  async cancelOrder(trackingId: string): Promise<CarrierResponse> {
    try {
      await this.client.post(`/parcels/${trackingId}/cancel/`);
      return { success: true, tracking_id: trackingId };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Cancel error: ${message}` };
    }
  }
}
