import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get last 7 days for revenue chart
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all analytics data in parallel
    const [
      totalOrders,
      totalRevenueResult,
      pendingOrders,
      pendingDeliveries,
      todayOrders,
      todayRevenueResult,
      recentOrders,
      ordersByStatusResult,
      revenueByDayResult,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),

      // Total revenue (only completed payments)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'COMPLETED' },
      }),

      // Pending orders (awaiting payment confirmation or printing)
      prisma.order.count({
        where: {
          status: { in: ['PENDING', 'PAYMENT_CONFIRMED', 'PRINTING'] },
        },
      }),

      // Pending deliveries (ready for delivery or out for delivery)
      prisma.order.count({
        where: {
          status: { in: ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'] },
        },
      }),

      // Today's orders
      prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
      }),

      // Today's revenue
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: today, lt: tomorrow },
          paymentStatus: 'COMPLETED',
        },
      }),

      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Revenue by day (last 7 days)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(total_amount) as amount
        FROM orders
        WHERE created_at >= ${sevenDaysAgo}
          AND payment_status = 'COMPLETED'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      ` as Promise<{ date: Date; amount: number }[]>,
    ]);

    // Format orders by status
    const ordersByStatus: Record<string, number> = {};
    ordersByStatusResult.forEach((item) => {
      ordersByStatus[item.status] = item._count.id;
    });

    // Format revenue by day
    const revenueByDay = (revenueByDayResult || []).map((item) => ({
      date: item.date.toISOString().split('T')[0],
      amount: Number(item.amount),
    }));

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenueResult._sum.totalAmount || 0,
      pendingOrders,
      pendingDeliveries,
      todayOrders,
      todayRevenue: todayRevenueResult._sum.totalAmount || 0,
      recentOrders,
      ordersByStatus,
      revenueByDay,
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
