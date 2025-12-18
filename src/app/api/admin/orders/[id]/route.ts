import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveDailyOrdersToExcel } from '@/lib/excel-export';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
          },
        },
        items: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching admin order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus, notes } = body;

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true, paymentStatus: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: any = {};
    const statusHistoryEntries: any[] = [];

    // Update order status
    if (status && status !== currentOrder.status) {
      updateData.status = status;
      statusHistoryEntries.push({
        orderId: id,
        status,
        changedBy: session.user.id,
        notes: notes || `Status updated by admin`,
      });
    }

    // Update payment status
    if (paymentStatus && paymentStatus !== currentOrder.paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      
      // If payment is confirmed, also update order status
      if (paymentStatus === 'COMPLETED' && currentOrder.status === 'PENDING') {
        updateData.status = 'PAYMENT_CONFIRMED';
        statusHistoryEntries.push({
          orderId: id,
          status: 'PAYMENT_CONFIRMED',
          changedBy: session.user.id,
          notes: 'Payment confirmed by admin',
        });
      }
    }

    // Update order and create status history entries
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          items: true,
          statusHistory: {
            orderBy: { changedAt: 'desc' },
          },
        },
      }),
      ...statusHistoryEntries.map((entry) =>
        prisma.orderStatusHistory.create({ data: entry })
      ),
    ]);

    // Auto-save to daily Excel report (non-blocking)
    saveDailyOrdersToExcel().catch(err => {
      console.error('Failed to update daily Excel report:', err);
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating admin order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
