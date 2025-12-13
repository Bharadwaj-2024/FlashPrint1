import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Check if user owns this order (unless admin)
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, paymentStatus, paymentId, note } = body;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Check authorization
    const isOwner = order.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    
    if (status) {
      // Only admin can update status (except payment confirmation)
      if (!isAdmin && status !== 'PAYMENT_CONFIRMED') {
        return NextResponse.json({ message: 'Unauthorized to update status' }, { status: 403 });
      }
      updateData.status = status;
      
      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'COMPLETED') {
        updateData.paidAt = new Date();
        if (paymentId) updateData.paymentId = paymentId;
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    // Add status history
    if (status) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: params.id,
          status,
          notes: note || null,
          changedBy: session.user.id,
        },
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
