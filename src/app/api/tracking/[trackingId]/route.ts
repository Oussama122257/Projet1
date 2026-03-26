import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createCarrierDriver, CarrierCode } from '@/lib/carriers';

export async function GET(
  _req: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  const { trackingId } = params;

  // Find order
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { carrierTrackingId: trackingId },
        { id: trackingId },
      ],
    },
    include: {
      statusHistory: { orderBy: { createdAt: 'desc' } },
      shop: { select: { name: true, carrierConfigs: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
  }

  // Try to get live tracking from carrier
  let carrierTracking = null;
  if (order.carrierCode && order.carrierTrackingId) {
    const carrierConfig = order.shop.carrierConfigs.find(
      (c) => c.carrierCode === order.carrierCode
    );

    if (carrierConfig) {
      try {
        const driver = createCarrierDriver(order.carrierCode as CarrierCode, {
          apiKey: carrierConfig.apiKey,
          apiSecret: carrierConfig.apiSecret || undefined,
          apiId: carrierConfig.apiId || undefined,
        });
        carrierTracking = await driver.getTracking(order.carrierTrackingId);
      } catch (error) {
        console.error('Carrier tracking fetch error:', error);
      }
    }
  }

  return NextResponse.json({
    tracking: {
      orderId: order.id,
      trackingId: order.carrierTrackingId,
      status: order.status,
      carrierCode: order.carrierCode,
      customerName: order.customerName,
      customerWilaya: order.customerWilaya,
      productName: order.productName,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      history: order.statusHistory,
      carrierTracking,
      shopName: order.shop.name,
    },
  });
}
