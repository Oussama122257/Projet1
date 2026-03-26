import crypto from 'crypto';
import axios from 'axios';
import { shopifyConfig } from './config';

export function verifyHmac(query: Record<string, string>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&');

  const generatedHmac = crypto
    .createHmac('sha256', shopifyConfig.apiSecret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHmac, 'hex'),
    Buffer.from(hmac, 'hex')
  );
}

export function verifyWebhookHmac(body: string, hmacHeader: string): boolean {
  const generatedHmac = crypto
    .createHmac('sha256', shopifyConfig.apiSecret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHmac, 'base64'),
    Buffer.from(hmacHeader, 'base64')
  );
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<string> {
  const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
    client_id: shopifyConfig.apiKey,
    client_secret: shopifyConfig.apiSecret,
    code,
  });

  return response.data.access_token;
}

export function verifyShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}
