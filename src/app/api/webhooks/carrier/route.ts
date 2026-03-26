import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

// Status mapping from carrier webhook statuses to our internal statuses
const CARRIER_STATUS_MAP: Record<string, OrderStatus> = {
  // Common carrier statuses
  'picked_up': 'DISPATCHED',
  'in_transit': 'IN_TRANSIT',
  'at_hub': 'AT_WILAYA',
  'at_center': 'AT_WILAYA',
  'out_for_delivery': 'OUT_FOR_DELIVERY',
  'delivering': 'OUT_FOR_DELIVERY',
  'delivered': 'DELIVERED',
  'returned': 'RETURNED',
  'failed': 'FAILED_DELIVERY',
  'cancelled': 'CANCELLED',
  // French status names
  'ramassé': 'DISPATCHED',
  'en transit': 'IN_TRANSIT',
  'au centre': 'AT_WILAYA',
  'en livraison': 'OUT_FOR_DELIVERY',
  'livré': 'DELIVERED',
  'retourné': 'RETURNED',
  'echec': 'FAILED_DELIVERY',
  'annulé': 'CANCELLED',
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      tracking_id,
      status,
      carrier_code,
      note,
      timestamp,
    } = body;

    if (!tracking_id || !status) {
      return NextResponse.json({ error: 'tracking_id and status required' }, { status: 400 });
    }

    // Find order by tracking ID
    const order = await prisma.order.findFirst({
      where: { carrierTrackingId: tracking_id },
      include: { shop: true },
    });

    if (!order) {
      // Log for debugging
      await prisma.webhookLog.create({
        data: {
          source: carrier_code || 'carrier',
          event: 'status_update',
          payload: body,
          status: 'order_not_found',
        },
      });
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Map carrier status to internal status
    const normalizedStatus = status.toLowerCase();
    const newStatus = CARRIER_STATUS_MAP[normalizedStatus];

    if (!newStatus) {
      // Log unrecognized status
      await prisma.webhookLog.create({
        data: {
          shopId: order.shopId,
          source: carrier_code || 'carrier',
          event: 'unknown_status',
          payload: body,
        },
      });
      return NextResponse.json({ warning: 'Unrecognized status', status });
    }

    // Update order
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'DELIVERED') {
      updateData.deliveredAt = timestamp ? new Date(timestamp) : new Date();
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        status: newStatus,
        source: carrier_code || 'carrier_webhook',
        note: note || `Mise à jour du transporteur: ${status}`,
      },
    });

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        shopId: order.shopId,
        source: carrier_code || 'carrier',
        event: 'status_update',
        payload: body,
        status: 'processed',
      },
    });

    return NextResponse.json({ success: true, orderId: order.id, newStatus });
  } catch (error) {
    console.error('Carrier webhook error:', error);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}
