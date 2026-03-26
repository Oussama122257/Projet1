import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const confirmationStatus = searchParams.get('confirmationStatus');
  const carrier = searchParams.get('carrier');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

  const where: Record<string, unknown> = { shopId, isArchived: false };
  if (status) where.status = status;
  if (confirmationStatus) where.confirmationStatus = confirmationStatus;
  if (carrier) where.carrierCode = carrier;
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search } },
      { shopifyOrderNumber: { contains: search } },
      { carrierTrackingId: { contains: search } },
      { productName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        assignedAgent: { select: { id: true, name: true } },
        _count: { select: { smsLogs: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const order = await prisma.order.create({
      data: {
        shopId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerPhone2: body.customerPhone2,
        customerEmail: body.customerEmail,
        customerWilaya: body.customerWilaya,
        customerCommune: body.customerCommune,
        customerAddress: body.customerAddress,
        customerNote: body.customerNote,
        productName: body.productName,
        productVariant: body.productVariant,
        quantity: body.quantity || 1,
        price: body.price,
        shippingPrice: body.shippingPrice || 0,
        totalPrice: body.totalPrice || body.price,
        isCOD: body.isCOD !== false,
        codAmount: body.codAmount,
        source: body.source || 'MANUAL',
        isExpress: body.isExpress || false,
        weight: body.weight,
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        status: 'NEW',
        source: 'system',
        note: 'Commande créée',
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
