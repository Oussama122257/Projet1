import axios, { AxiosInstance } from 'axios';
import { shopifyConfig, getShopifyApiHeaders } from './config';

export class ShopifyClient {
  private client: AxiosInstance;
  private shop: string;

  constructor(shop: string, accessToken: string) {
    this.shop = shop;
    this.client = axios.create({
      baseURL: `https://${shop}/admin/api/${shopifyConfig.apiVersion}`,
      headers: getShopifyApiHeaders(accessToken),
    });
  }

  // ===== ORDERS =====

  async getOrders(params?: {
    status?: string;
    limit?: number;
    since_id?: string;
    created_at_min?: string;
    created_at_max?: string;
    fields?: string;
  }) {
    const { data } = await this.client.get('/orders.json', { params });
    return data.orders;
  }

  async getOrder(orderId: string) {
    const { data } = await this.client.get(`/orders/${orderId}.json`);
    return data.order;
  }

  async updateOrder(orderId: string, updates: Record<string, unknown>) {
    const { data } = await this.client.put(`/orders/${orderId}.json`, {
      order: updates,
    });
    return data.order;
  }

  async addOrderNote(orderId: string, note: string) {
    return this.updateOrder(orderId, { note });
  }

  async addOrderTag(orderId: string, tags: string[]) {
    const order = await this.getOrder(orderId);
    const existingTags = order.tags ? order.tags.split(',').map((t: string) => t.trim()) : [];
    const newTags = [...new Set([...existingTags, ...tags])].join(', ');
    return this.updateOrder(orderId, { tags: newTags });
  }

  // ===== FULFILLMENTS =====

  async createFulfillment(orderId: string, fulfillment: {
    tracking_number?: string;
    tracking_company?: string;
    tracking_url?: string;
    line_items?: Array<{ id: string; quantity: number }>;
  }) {
    const { data } = await this.client.post(`/orders/${orderId}/fulfillments.json`, {
      fulfillment: { ...fulfillment, notify_customer: false },
    });
    return data.fulfillment;
  }

  async updateFulfillmentTracking(fulfillmentId: string, tracking: {
    tracking_number: string;
    tracking_url?: string;
    tracking_company?: string;
  }) {
    const { data } = await this.client.put(`/fulfillments/${fulfillmentId}.json`, {
      fulfillment: { tracking_info: tracking },
    });
    return data.fulfillment;
  }

  // ===== PRODUCTS =====

  async getProducts(params?: { limit?: number; fields?: string }) {
    const { data } = await this.client.get('/products.json', { params });
    return data.products;
  }

  // ===== CUSTOMERS =====

  async getCustomer(customerId: string) {
    const { data } = await this.client.get(`/customers/${customerId}.json`);
    return data.customer;
  }

  // ===== WEBHOOKS =====

  async registerWebhooks(webhookUrl: string) {
    const topics = [
      'orders/create',
      'orders/updated',
      'orders/cancelled',
      'orders/fulfilled',
      'orders/paid',
      'app/uninstalled',
    ];

    const results = [];
    for (const topic of topics) {
      try {
        const { data } = await this.client.post('/webhooks.json', {
          webhook: {
            topic,
            address: `${webhookUrl}/api/webhooks/shopify`,
            format: 'json',
          },
        });
        results.push({ topic, success: true, id: data.webhook.id });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({ topic, success: false, error: message });
      }
    }
    return results;
  }

  async getShopInfo() {
    const { data } = await this.client.get('/shop.json');
    return data.shop;
  }
}
