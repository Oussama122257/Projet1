import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderIds, confirmationStatus, note } = await req.json();

    if (!orderIds?.length || !confirmationStatus) {
      return NextResponse.json({ error: 'orderIds et confirmationStatus requis' }, { status: 400 });
    }

    const validStatuses = ['CONFIRMED', 'NO_ANSWER', 'POSTPONED', 'CANCELLED', 'DUPLICATE'];
    if (!validStatuses.includes(confirmationStatus)) {
      return NextResponse.json({ error: 'Statut de confirmation invalide' }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, shopId },
    });

    const results = [];

    for (const order of orders) {
      const newStatus = confirmationStatus === 'CONFIRMED' ? 'CONFIRMED' :
                        confirmationStatus === 'CANCELLED' ? 'CANCELLED' : order.status;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          confirmationStatus,
          status: newStatus !== order.status ? newStatus : undefined,
        },
      });

      if (newStatus !== order.status) {
        await prisma.statusHistory.create({
          data: {
            orderId: order.id,
            status: newStatus,
            source: 'confirmation',
            note: note || `Confirmation: ${confirmationStatus}`,
          },
        });
      }

      results.push({ orderId: order.id, confirmationStatus, status: newStatus });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Erreur lors de la confirmation' }, { status: 500 });
  }
}
