export const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecret: process.env.SHOPIFY_API_SECRET!,
  scopes: (process.env.SHOPIFY_SCOPES || 'read_orders,write_orders,read_products,read_customers,write_shipping').split(','),
  hostName: process.env.SHOPIFY_HOST_NAME!,
  apiVersion: '2024-04',
  isEmbeddedApp: true,
};

export const SHOPIFY_AUTH_CALLBACK_PATH = '/api/auth/callback';

export function getInstallUrl(shop: string): string {
  const scopes = shopifyConfig.scopes.join(',');
  const redirectUri = `https://${shopifyConfig.hostName}${SHOPIFY_AUTH_CALLBACK_PATH}`;
  return `https://${shop}/admin/oauth/authorize?client_id=${shopifyConfig.apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function getShopifyApiHeaders(accessToken: string) {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken,
  };
}
