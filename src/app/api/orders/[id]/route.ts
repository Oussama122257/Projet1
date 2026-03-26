import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.order.findFirst({
    where: { id: params.id, shopId },
    include: {
      assignedAgent: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
      smsLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

  return NextResponse.json({ order });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const order = await prisma.order.findFirst({ where: { id: params.id, shopId } });
    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: body,
    });

    // Track status change
    if (body.status && body.status !== order.status) {
      await prisma.statusHistory.create({
        data: {
          orderId: order.id,
          status: body.status,
          source: 'manual',
          note: body.statusNote || `Statut changé vers ${body.status}`,
        },
      });
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.order.findFirst({ where: { id: params.id, shopId } });
  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

  await prisma.order.update({
    where: { id: params.id },
    data: { isArchived: true },
  });

  return NextResponse.json({ success: true });
}
