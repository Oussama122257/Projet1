import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookHmac } from '@/lib/shopify/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get('x-shopify-hmac-sha256') || '';
  const topic = req.headers.get('x-shopify-topic') || '';
  const shopDomain = req.headers.get('x-shopify-shop-domain') || '';

  // Verify HMAC
  if (!verifyWebhookHmac(body, hmac)) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
  }

  const payload = JSON.parse(body);

  // Log webhook
  const shop = await prisma.shop.findUnique({ where: { shopifyDomain: shopDomain } });
  await prisma.webhookLog.create({
    data: {
      shopId: shop?.id,
      source: 'shopify',
      event: topic,
      payload,
    },
  });

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  try {
    switch (topic) {
      case 'orders/create':
        await handleOrderCreate(shop.id, payload);
        break;
      case 'orders/updated':
        await handleOrderUpdate(shop.id, payload);
        break;
      case 'orders/cancelled':
        await handleOrderCancelled(shop.id, payload);
        break;
      case 'app/uninstalled':
        await handleAppUninstalled(shop.id);
        break;
    }
  } catch (error) {
    console.error(`Webhook ${topic} error:`, error);
  }

  return NextResponse.json({ success: true });
}

async function handleOrderCreate(shopId: string, payload: Record<string, unknown>) {
  const shipping = (payload.shipping_address || {}) as Record<string, string>;
  const lineItems = (payload.line_items || []) as Array<Record<string, unknown>>;
  const productNames = lineItems.map((item) => item.title).join(', ');
  const totalQuantity = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  await prisma.order.upsert({
    where: {
      shopId_shopifyOrderId: {
        shopId,
        shopifyOrderId: String(payload.id),
      },
    },
    update: {},
    create: {
      shopId,
      shopifyOrderId: String(payload.id),
      shopifyOrderNumber: String(payload.order_number || payload.name),
      customerName: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim() || 'Client',
      customerPhone: String(shipping.phone || (payload.customer as Record<string, string>)?.phone || ''),
      customerEmail: String(payload.email || ''),
      customerWilaya: shipping.province || shipping.city || '',
      customerCommune: shipping.city || '',
      customerAddress: `${shipping.address1 || ''} ${shipping.address2 || ''}`.trim(),
      customerNote: String(payload.note || ''),
      productName: productNames || 'Produit',
      quantity: totalQuantity || 1,
      price: parseFloat(String(payload.total_price)) || 0,
      shippingPrice: parseFloat(String(payload.total_shipping_price_set && (payload.total_shipping_price_set as Record<string, Record<string, string>>).shop_money?.amount)) || 0,
      totalPrice: parseFloat(String(payload.total_price)) || 0,
      isCOD: String(payload.gateway) === 'Cash on Delivery (COD)' || String(payload.payment_gateway_names).includes('cod'),
      codAmount: parseFloat(String(payload.total_price)) || 0,
      source: 'SHOPIFY',
      status: 'NEW',
    },
  });
}

async function handleOrderUpdate(shopId: string, payload: Record<string, unknown>) {
  const order = await prisma.order.findFirst({
    where: { shopId, shopifyOrderId: String(payload.id) },
  });

  if (!order) return;

  // Update financial status tracking
  if (payload.financial_status === 'paid' && !order.isPaid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { isPaid: true },
    });
  }
}

async function handleOrderCancelled(shopId: string, payload: Record<string, unknown>) {
  const order = await prisma.order.findFirst({
    where: { shopId, shopifyOrderId: String(payload.id) },
  });

  if (!order) return;

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' },
  });

  await prisma.statusHistory.create({
    data: {
      orderId: order.id,
      status: 'CANCELLED',
      source: 'shopify_webhook',
      note: 'Annulé depuis Shopify',
    },
  });
}

async function handleAppUninstalled(shopId: string) {
  await prisma.shop.update({
    where: { id: shopId },
    data: { isActive: false },
  });
}
