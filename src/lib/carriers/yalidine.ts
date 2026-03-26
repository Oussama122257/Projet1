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
  'En préparation': 'pending',
  'Ramassé': 'picked_up',
  'Vers Wilaya': 'in_transit',
  'Reçu à Wilaya': 'at_hub',
  'En livraison': 'out_for_delivery',
  'Livré': 'delivered',
  'Echec livraison': 'failed',
  'Retour en hub': 'returned',
  'Retourné': 'returned',
  'Annulé': 'cancelled',
};

export class YalidineCarrier implements CarrierDriver {
  private client: AxiosInstance;

  constructor(apiId: string, apiKey: string) {
    this.client = axios.create({
      baseURL: process.env.YALIDINE_BASE_URL || 'https://api.yalidine.app/v1',
      headers: {
        'X-API-ID': apiId,
        'X-API-TOKEN': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrder(order: CarrierOrder): Promise<CarrierResponse> {
    try {
      const payload = {
        order_id: order.external_id,
        firstname: order.customer_name.split(' ')[0],
        familyname: order.customer_name.split(' ').slice(1).join(' ') || order.customer_name,
        contact_phone: order.customer_phone,
        address: order.customer_address,
        to_commune_name: order.commune,
        to_wilaya_name: order.wilaya,
        product_list: order.product_name,
        price: order.is_cod ? order.cod_amount || order.price : 0,
        do_insurance: false,
        declared_value: order.price,
        height: 10,
        width: 10,
        length: 10,
        weight: order.weight || 0.5,
        freeshipping: !order.is_cod,
        is_stopdesk: false,
        has_exchange: false,
        note: order.note || '',
      };

      const { data } = await this.client.post('/parcels/', [payload]);
      const result = data[0];

      if (result?.tracking) {
        return {
          success: true,
          tracking_id: result.tracking,
          label_url: result.label,
          raw: result,
        };
      }

      return { success: false, error: result?.error || 'Yalidine order creation failed', raw: data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Yalidine error: ${message}` };
    }
  }

  async createBulkOrders(orders: CarrierOrder[]): Promise<CarrierResponse[]> {
    try {
      const payloads = orders.map((order) => ({
        order_id: order.external_id,
        firstname: order.customer_name.split(' ')[0],
        familyname: order.customer_name.split(' ').slice(1).join(' ') || order.customer_name,
        contact_phone: order.customer_phone,
        address: order.customer_address,
        to_commune_name: order.commune,
        to_wilaya_name: order.wilaya,
        product_list: order.product_name,
        price: order.is_cod ? order.cod_amount || order.price : 0,
        do_insurance: false,
        declared_value: order.price,
        height: 10,
        width: 10,
        length: 10,
        weight: order.weight || 0.5,
        freeshipping: !order.is_cod,
        is_stopdesk: false,
        has_exchange: false,
        note: order.note || '',
      }));

      const { data } = await this.client.post('/parcels/', payloads);

      return data.map((result: { tracking?: string; label?: string; error?: string }) => ({
        success: !!result.tracking,
        tracking_id: result.tracking,
        label_url: result.label,
        error: result.error,
        raw: result,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return orders.map(() => ({ success: false, error: `Yalidine bulk error: ${message}` }));
    }
  }

  async getTracking(trackingId: string): Promise<TrackingInfo> {
    const { data } = await this.client.get(`/parcels/${trackingId}/`);

    const events: TrackingEvent[] = (data.tracking_history || []).map(
      (event: { status: string; date: string; note?: string }) => ({
        status: event.status,
        description: event.status,
        timestamp: event.date,
      })
    );

    return {
      tracking_id: trackingId,
      status: data.last_status || 'Unknown',
      normalized_status: STATUS_MAP[data.last_status] || 'pending',
      timestamp: data.last_status_date || new Date().toISOString(),
      events,
    };
  }

  async getLabel(trackingId: string): Promise<string> {
    const { data } = await this.client.get(`/parcels/${trackingId}/label/`);
    return data.label_url || '';
  }

  async getBordereau(trackingIds: string[]): Promise<string> {
    const { data } = await this.client.post('/parcels/bordereau/', {
      trackings: trackingIds,
    });
    return data.bordereau_url || '';
  }

  async getPricing(): Promise<CarrierPricing[]> {
    const { data } = await this.client.get('/deliveryfees/');
    return (data || []).map(
      (fee: { wilaya_name: string; home_fee: number; desk_fee: number }) => ({
        wilaya_from: 'Algiers',
        wilaya_to: fee.wilaya_name,
        desk_price: fee.desk_fee,
        home_price: fee.home_fee,
      })
    );
  }

  async cancelOrder(trackingId: string): Promise<CarrierResponse> {
    try {
      await this.client.delete(`/parcels/${trackingId}/`);
      return { success: true, tracking_id: trackingId };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Cancel error: ${message}` };
    }
  }
}
