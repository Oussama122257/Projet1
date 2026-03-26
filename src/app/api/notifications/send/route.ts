import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendSms, renderTemplate, DEFAULT_TEMPLATES } from '@/lib/notifications/sms';
import { generateTrackingUrl } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderIds, trigger, customMessage } = await req.json();

    if (!orderIds?.length) {
      return NextResponse.json({ error: 'orderIds requis' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { notifications: true },
    });

    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, shopId },
    });

    const results = [];

    for (const order of orders) {
      if (!order.customerPhone) {
        results.push({ orderId: order.id, success: false, error: 'No phone number' });
        continue;
      }

      // Get template
      let message = customMessage;
      if (!message) {
        const template = shop.notifications.find(
          (t) => t.trigger === (trigger || order.status) && t.isActive
        );
        message = template?.messageFr || DEFAULT_TEMPLATES[trigger || order.status]?.fr;
      }

      if (!message) {
        results.push({ orderId: order.id, success: false, error: 'No template found' });
        continue;
      }

      // Render template
      const rendered = renderTemplate(message, {
        customer_name: order.customerName,
        order_number: order.shopifyOrderNumber || order.id.slice(-8),
        tracking_url: generateTrackingUrl(order.carrierTrackingId || order.id),
        carrier_name: order.carrierCode || '',
        wilaya: order.customerWilaya,
        product_name: order.productName,
        total_price: order.totalPrice.toString(),
        shop_name: shop.name || 'ColiShip DZ',
      });

      // Send SMS
      const smsResult = await sendSms({ to: order.customerPhone, message: rendered });

      // Log SMS
      await prisma.smsLog.create({
        data: {
          shopId,
          orderId: order.id,
          phone: order.customerPhone,
          message: rendered,
          status: smsResult.success ? 'SENT' : 'FAILED',
          provider: process.env.SMS_PROVIDER || 'twilio',
          providerMessageId: smsResult.messageId,
          sentAt: smsResult.success ? new Date() : null,
        },
      });

      results.push({
        orderId: order.id,
        success: smsResult.success,
        error: smsResult.error,
      });
    }

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    console.error('Notification send error:', error);
    return NextResponse.json({ error: 'Erreur d\'envoi' }, { status: 500 });
  }
}
