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
  'Nouveau': 'pending',
  'Enlevé': 'picked_up',
  'En transit': 'in_transit',
  'Au centre': 'at_hub',
  'En livraison': 'out_for_delivery',
  'Livré': 'delivered',
  'Retour': 'returned',
  'Echec livraison': 'failed',
};

export class ProcolisCarrier implements CarrierDriver {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: process.env.PROCOLIS_BASE_URL || 'https://procolis.com/api_v1',
      headers: {
        token: apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrder(order: CarrierOrder): Promise<CarrierResponse> {
    try {
      const payload = {
        Ession: order.external_id || '',
        Nom: order.customer_name,
        Telephone: order.customer_phone,
        Telephone_2: order.customer_phone2 || '',
        Adresse: order.customer_address,
        Wilaya: order.wilaya,
        Commune: order.commune,
        Produit: order.product_name,
        Quantite: order.quantity,
        Prix: order.is_cod ? order.cod_amount || order.price : 0,
        Poids: order.weight || 0.5,
        Remarque: order.note || '',
        Type_livraison: order.is_express ? 'Express' : 'Normal',
      };

      const { data } = await this.client.post('/create_order', payload);

      return {
        success: !!data.tracking,
        tracking_id: data.tracking,
        label_url: data.label,
        raw: data,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Procolis error: ${message}` };
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
    const { data } = await this.client.get(`/tracking/${trackingId}`);

    const events: TrackingEvent[] = (data.historique || []).map(
      (event: { statut: string; date: string; lieu?: string }) => ({
        status: event.statut,
        description: event.statut,
        location: event.lieu,
        timestamp: event.date,
      })
    );

    return {
      tracking_id: trackingId,
      status: data.statut || 'Unknown',
      normalized_status: STATUS_MAP[data.statut] || 'pending',
      timestamp: data.date_maj || new Date().toISOString(),
      events,
    };
  }

  async getLabel(trackingId: string): Promise<string> {
    const { data } = await this.client.get(`/label/${trackingId}`);
    return data.url || '';
  }

  async getBordereau(trackingIds: string[]): Promise<string> {
    const { data } = await this.client.post('/bordereau', { trackings: trackingIds });
    return data.url || '';
  }

  async getPricing(): Promise<CarrierPricing[]> {
    const { data } = await this.client.get('/tarifs');
    return (data || []).map(
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
      const { data } = await this.client.post(`/cancel/${trackingId}`);
      return { success: !!data.success, tracking_id: trackingId, raw: data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Cancel error: ${message}` };
    }
  }
}
