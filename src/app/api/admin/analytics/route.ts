import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch analytics data with error handling for each query
    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let pendingDeliveries = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    let recentOrders: any[] = [];
    let ordersByStatus: Record<string, number> = {};

    try {
      // Basic counts - these should be fast
      [totalOrders, pendingOrders, pendingDeliveries, todayOrders] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({
          where: { status: { in: ['PENDING', 'PAYMENT_CONFIRMED', 'PRINTING'] } },
        }),
        prisma.order.count({
          where: { status: { in: ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'] } },
        }),
        prisma.order.count({
          where: { createdAt: { gte: today, lt: tomorrow } },
        }),
      ]);
    } catch (e) {
      console.error('Count queries failed:', e);
    }

    try {
      // Revenue queries
      const [totalRevenueResult, todayRevenueResult] = await Promise.all([
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { paymentStatus: 'COMPLETED' },
        }),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: { gte: today, lt: tomorrow },
            paymentStatus: 'COMPLETED',
          },
        }),
      ]);
      totalRevenue = totalRevenueResult._sum.totalAmount || 0;
      todayRevenue = todayRevenueResult._sum.totalAmount || 0;
    } catch (e) {
      console.error('Revenue queries failed:', e);
    }

    try {
      // Recent orders
      recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      });
    } catch (e) {
      console.error('Recent orders query failed:', e);
    }

    try {
      // Orders by status
      const statusGroups = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      });
      statusGroups.forEach((item) => {
        ordersByStatus[item.status] = item._count.id;
      });
    } catch (e) {
      console.error('Status group query failed:', e);
    }

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      pendingDeliveries,
      todayOrders,
      todayRevenue,
      recentOrders,
      ordersByStatus,
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
