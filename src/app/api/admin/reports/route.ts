import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

const prisma = new PrismaClient();

// GET - Fetch daily report data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const date = parseISO(dateStr);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get pricing config for cost calculation
    const pricingDb = await prisma.pricingConfig.findUnique({
      where: { id: 'default' }
    });
    
    const pricing = {
      bwPricePerPage: pricingDb?.bwPricePerPage ?? 3,
      colorPricePerPage: pricingDb?.colorPricePerPage ?? 12,
      bwCostPerPage: (pricingDb as any)?.bwCostPerPage ?? 1,
      colorCostPerPage: (pricingDb as any)?.colorCostPerPage ?? 5
    };

    // Get all completed orders for the day
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: dayStart,
          lte: dayEnd
        },
        status: {
          in: ['DELIVERED', 'READY_FOR_DELIVERY', 'PRINTING', 'PAYMENT_CONFIRMED', 'PENDING'] as OrderStatus[]
        }
      },
      include: {
        items: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Calculate totals
    let totalOrders = orders.length;
    let totalCopies = 0;
    let totalPages = 0;
    let bwPages = 0;
    let colorPages = 0;
    let grossRevenue = 0;

    const orderDetails = orders.map(order => {
      let orderCopies = 0;
      let orderPages = 0;
      let orderBwPages = 0;
      let orderColorPages = 0;

        order.items.forEach((item) => {
        const itemPages = item.pageCount * item.copies;
        orderCopies += item.copies;
        orderPages += itemPages;
        
        if (item.printType === 'BW') {
          orderBwPages += itemPages;
          bwPages += itemPages;
        } else {
          orderColorPages += itemPages;
          colorPages += itemPages;
        }
      });

      totalCopies += orderCopies;
      totalPages += orderPages;
      grossRevenue += order.totalAmount;

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Unknown',
        customerEmail: order.user?.email || 'Unknown',
        copies: orderCopies,
        pages: orderPages,
        bwPages: orderBwPages,
        colorPages: orderColorPages,
        amount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      };
    });

    // Calculate production cost
    const productionCost = (bwPages * (pricing.bwCostPerPage || 1)) + 
                          (colorPages * (pricing.colorCostPerPage || 5));

    // Get daily expenses
    const expenses = await prisma.dailyExpense.findMany({
      where: {
        date: dayStart
      }
    });

    const otherExpenses = expenses.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0);
    const netProfit = grossRevenue - productionCost - otherExpenses;

    // Return report data
    return NextResponse.json({
      date: dateStr,
      summary: {
        totalOrders,
        totalCopies,
        totalPages,
        bwPages,
        colorPages,
        grossRevenue,
        productionCost,
        otherExpenses,
        netProfit
      },
      orders: orderDetails,
      expenses,
      pricing: {
        bwPrice: pricing.bwPricePerPage,
        colorPrice: pricing.colorPricePerPage,
        bwCost: pricing.bwCostPerPage || 1,
        colorCost: pricing.colorCostPerPage || 5
      }
    });
  } catch (error) {
    console.error('Error fetching daily report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

// POST - Add an expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, category, amount, description } = body;

    if (!date || !category || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expense = await prisma.dailyExpense.create({
      data: {
        date: startOfDay(parseISO(date)),
        category,
        amount: parseFloat(amount),
        description: description || null,
        createdBy: session.user.email || null
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}

// DELETE - Remove an expense
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
    }

    await prisma.dailyExpense.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
