import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createCarrierDriver, CarrierCode } from '@/lib/carriers';

export async function POST(req: NextRequest) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderIds, carrierCode } = await req.json();

    if (!orderIds?.length || !carrierCode) {
      return NextResponse.json({ error: 'orderIds et carrierCode requis' }, { status: 400 });
    }

    // Get carrier config
    const carrierConfig = await prisma.carrierConfig.findUnique({
      where: { shopId_carrierCode: { shopId, carrierCode } },
    });

    if (!carrierConfig || !carrierConfig.isActive) {
      return NextResponse.json({ error: 'Transporteur non configuré ou inactif' }, { status: 400 });
    }

    // Get orders
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, shopId, status: 'CONFIRMED' },
    });

    if (!orders.length) {
      return NextResponse.json({ error: 'Aucune commande confirmée trouvée' }, { status: 400 });
    }

    // Create carrier driver
    const driver = createCarrierDriver(carrierCode as CarrierCode, {
      apiKey: carrierConfig.apiKey,
      apiSecret: carrierConfig.apiSecret || undefined,
      apiId: carrierConfig.apiId || undefined,
    });

    // Dispatch orders to carrier
    const carrierOrders = orders.map((order) => ({
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_phone2: order.customerPhone2 || undefined,
      customer_address: order.customerAddress,
      wilaya: order.customerWilaya,
      commune: order.customerCommune,
      product_name: order.productName,
      quantity: order.quantity,
      price: order.totalPrice,
      is_cod: order.isCOD,
      cod_amount: order.codAmount || undefined,
      weight: order.weight || undefined,
      is_express: order.isExpress,
      note: order.customerNote || undefined,
      external_id: order.id,
    }));

    const results = await driver.createBulkOrders(carrierOrders);

    // Update orders with tracking info
    const dispatched = [];
    const failed = [];

    for (let i = 0; i < orders.length; i++) {
      const result = results[i];
      const order = orders[i];

      if (result.success && result.tracking_id) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'DISPATCHED',
            carrierCode: carrierCode as CarrierCode,
            carrierTrackingId: result.tracking_id,
            carrierLabel: result.label_url || null,
          },
        });

        await prisma.statusHistory.create({
          data: {
            orderId: order.id,
            status: 'DISPATCHED',
            source: carrierCode,
            note: `Expédié via ${carrierCode} - Tracking: ${result.tracking_id}`,
          },
        });

        dispatched.push({ orderId: order.id, trackingId: result.tracking_id });
      } else {
        failed.push({ orderId: order.id, error: result.error });
      }
    }

    return NextResponse.json({
      dispatched,
      failed,
      summary: {
        total: orders.length,
        success: dispatched.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error('Dispatch error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'expédition' }, { status: 500 });
  }
}
