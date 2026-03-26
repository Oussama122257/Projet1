import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const period = searchParams.get('period') || '7d';

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
    case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
    default: startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const [
    totalOrders,
    statusCounts,
    recentOrders,
    revenue,
    carrierStats,
    dailyOrders,
  ] = await Promise.all([
    // Total orders in period
    prisma.order.count({
      where: { shopId, createdAt: { gte: startDate } },
    }),

    // Orders by status
    prisma.order.groupBy({
      by: ['status'],
      where: { shopId, createdAt: { gte: startDate } },
      _count: true,
    }),

    // Recent orders
    prisma.order.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, customerName: true, customerWilaya: true, status: true,
        totalPrice: true, carrierCode: true, createdAt: true, shopifyOrderNumber: true,
      },
    }),

    // Revenue
    prisma.order.aggregate({
      where: { shopId, createdAt: { gte: startDate }, status: 'DELIVERED' },
      _sum: { totalPrice: true, codAmount: true, shippingPrice: true },
      _count: true,
    }),

    // Stats by carrier
    prisma.order.groupBy({
      by: ['carrierCode'],
      where: { shopId, createdAt: { gte: startDate }, carrierCode: { not: null } },
      _count: true,
    }),

    // Daily order counts (last 7 days)
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'RETURNED' THEN 1 END) as returned
      FROM "Order"
      WHERE shop_id = ${shopId} AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Promise<Array<{ date: string; count: number; delivered: number; returned: number }>>,
  ]);

  const statusMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count])
  );

  const deliveredCount = statusMap['DELIVERED'] || 0;
  const returnedCount = statusMap['RETURNED'] || 0;
  const deliveryRate = totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : '0';
  const returnRate = totalOrders > 0 ? ((returnedCount / totalOrders) * 100).toFixed(1) : '0';

  return NextResponse.json({
    overview: {
      totalOrders,
      deliveredOrders: deliveredCount,
      returnedOrders: returnedCount,
      pendingOrders: (statusMap['NEW'] || 0) + (statusMap['CONFIRMED'] || 0),
      inTransitOrders: (statusMap['IN_TRANSIT'] || 0) + (statusMap['DISPATCHED'] || 0) + (statusMap['OUT_FOR_DELIVERY'] || 0),
      deliveryRate: parseFloat(deliveryRate),
      returnRate: parseFloat(returnRate),
      revenue: revenue._sum.totalPrice || 0,
      codCollected: revenue._sum.codAmount || 0,
      shippingCost: revenue._sum.shippingPrice || 0,
    },
    statusBreakdown: statusCounts,
    carrierStats,
    dailyOrders,
    recentOrders,
  });
}
