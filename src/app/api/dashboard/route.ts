import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Optimized: Single query for recent orders with aggregation
    const recentOrders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    // Calculate stats from the orders we already have (for small datasets)
    // For larger datasets, use the parallel count queries
    const totalOrders = recentOrders.length;
    const pendingOrders = recentOrders.filter(o => 
      ['PENDING', 'PAYMENT_CONFIRMED', 'PRINTING'].includes(o.status)
    ).length;
    const completedOrders = recentOrders.filter(o => o.status === 'DELIVERED').length;
    const totalSpent = recentOrders
      .filter((order) => order.paymentStatus === 'COMPLETED')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // If user has more than 10 orders, get accurate counts
    let stats = { totalOrders, pendingOrders, completedOrders, totalSpent };
    
    if (recentOrders.length === 10) {
      // User might have more orders, get accurate counts in parallel
      const [actualTotal, actualPending, actualCompleted, allOrders] = await Promise.all([
        prisma.order.count({ where: { userId } }),
        prisma.order.count({
          where: {
            userId,
            status: { in: ['PENDING', 'PAYMENT_CONFIRMED', 'PRINTING'] },
          },
        }),
        prisma.order.count({
          where: { userId, status: 'DELIVERED' },
        }),
        prisma.order.findMany({
          where: { userId, paymentStatus: 'COMPLETED' },
          select: { totalAmount: true },
        }),
      ]);

      stats = {
        totalOrders: actualTotal,
        pendingOrders: actualPending,
        completedOrders: actualCompleted,
        totalSpent: allOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      };
    }

    return NextResponse.json({
      stats,
      recentOrders: recentOrders.slice(0, 5),
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10', // Cache for 10 seconds
      },
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
