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
  'Ramassé': 'picked_up',
  'Transféré': 'in_transit',
  'Centre': 'at_hub',
  'En livraison': 'out_for_delivery',
  'Livré': 'delivered',
  'Retour': 'returned',
  'Echec': 'failed',
};

export class ZRExpressCarrier implements CarrierDriver {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: process.env.ZR_EXPRESS_BASE_URL || 'https://api.zrexpress.com/api',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrder(order: CarrierOrder): Promise<CarrierResponse> {
    try {
      const payload = {
        nom: order.customer_name,
        telephone: order.customer_phone,
        telephone_2: order.customer_phone2 || '',
        adresse: order.customer_address,
        wilaya: order.wilaya,
        commune: order.commune,
        produit: order.product_name,
        quantite: order.quantity,
        prix: order.is_cod ? order.cod_amount || order.price : 0,
        poids: order.weight || 0.5,
        remarque: order.note || '',
        reference: order.external_id || '',
        livraison_type: order.is_express ? 'express' : 'normal',
      };

      const { data } = await this.client.post('/order/create', payload);

      return {
        success: data.success || !!data.tracking,
        tracking_id: data.tracking,
        label_url: data.label_url,
        raw: data,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `ZR Express error: ${message}` };
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
    const { data } = await this.client.get(`/order/tracking/${trackingId}`);

    const events: TrackingEvent[] = (data.history || []).map(
      (event: { status: string; date: string; note?: string; location?: string }) => ({
        status: event.status,
        description: event.note || event.status,
        location: event.location,
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
    const { data } = await this.client.get(`/order/label/${trackingId}`);
    return data.url || '';
  }

  async getBordereau(trackingIds: string[]): Promise<string> {
    const { data } = await this.client.post('/order/bordereau', {
      trackings: trackingIds,
    });
    return data.url || '';
  }

  async getPricing(): Promise<CarrierPricing[]> {
    const { data } = await this.client.get('/tarifs');
    return (data.tarifs || []).map(
      (t: { wilaya: string; domicile: number; stopdesk: number }) => ({
        wilaya_from: 'Algiers',
        wilaya_to: t.wilaya,
        desk_price: t.stopdesk,
        home_price: t.domicile,
      })
    );
  }

  async cancelOrder(trackingId: string): Promise<CarrierResponse> {
    try {
      const { data } = await this.client.post(`/order/cancel/${trackingId}`);
      return { success: data.success, tracking_id: trackingId, raw: data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Cancel error: ${message}` };
    }
  }
}
