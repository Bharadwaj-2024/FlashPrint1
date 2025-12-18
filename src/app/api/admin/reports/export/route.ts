import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { startOfDay, endOfDay, parseISO, format } from 'date-fns';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

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

    // Get pricing config
    const pricingDb = await prisma.pricingConfig.findUnique({
      where: { id: 'default' }
    });
    
    const pricing = {
      bwPricePerPage: pricingDb?.bwPricePerPage ?? 3,
      colorPricePerPage: pricingDb?.colorPricePerPage ?? 12,
      bwCostPerPage: (pricingDb as any)?.bwCostPerPage ?? 1,
      colorCostPerPage: (pricingDb as any)?.colorCostPerPage ?? 5
    };

    // Get orders
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get expenses
    const expenses = await prisma.dailyExpense.findMany({
      where: {
        date: dayStart
      }
    });

    // Calculate totals
    let totalCopies = 0;
    let totalPages = 0;
    let bwPages = 0;
    let colorPages = 0;
    let grossRevenue = 0;

    // Prepare orders data for Excel
    const ordersData = orders.map((order, index) => {
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
        } else {
          orderColorPages += itemPages;
        }
      });

      totalCopies += orderCopies;
      totalPages += orderPages;
      bwPages += orderBwPages;
      colorPages += orderColorPages;
      grossRevenue += order.totalAmount;

      return {
        'S.No': index + 1,
        'Order Number': order.orderNumber,
        'Customer Name': order.user?.name || 'Unknown',
        'Customer Email': order.user?.email || 'Unknown',
        'Copies': orderCopies,
        'Total Pages': orderPages,
        'B&W Pages': orderBwPages,
        'Color Pages': orderColorPages,
        'Amount (₹)': order.totalAmount,
        'Status': order.status,
        'Time': format(order.createdAt, 'hh:mm a')
      };
    });

    // Calculate costs
    const productionCost = (bwPages * pricing.bwCostPerPage) + 
                          (colorPages * pricing.colorCostPerPage);
    const otherExpenses = expenses.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0);
    const netProfit = grossRevenue - productionCost - otherExpenses;

    // Prepare expenses data for Excel
    const expensesData = expenses.map((exp: { category: string; description: string | null; amount: number }, index: number) => ({
      'S.No': index + 1,
      'Category': exp.category.toUpperCase(),
      'Description': exp.description || '-',
      'Amount (₹)': exp.amount
    }));

    // Prepare summary data
    const summaryData = [
      { 'Metric': 'Date', 'Value': format(date, 'dd MMMM yyyy') },
      { 'Metric': 'Total Orders', 'Value': orders.length },
      { 'Metric': 'Total Copies', 'Value': totalCopies },
      { 'Metric': 'Total Pages Printed', 'Value': totalPages },
      { 'Metric': 'B&W Pages', 'Value': bwPages },
      { 'Metric': 'Color Pages', 'Value': colorPages },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'REVENUE & COSTS', 'Value': '' },
      { 'Metric': 'Gross Revenue', 'Value': `₹${grossRevenue.toFixed(2)}` },
      { 'Metric': 'Production Cost', 'Value': `₹${productionCost.toFixed(2)}` },
      { 'Metric': 'Other Expenses', 'Value': `₹${otherExpenses.toFixed(2)}` },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'NET PROFIT', 'Value': `₹${netProfit.toFixed(2)}` },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'PRICING CONFIG', 'Value': '' },
      { 'Metric': 'B&W Price/Page', 'Value': `₹${pricing.bwPricePerPage}` },
      { 'Metric': 'Color Price/Page', 'Value': `₹${pricing.colorPricePerPage}` },
      { 'Metric': 'B&W Cost/Page', 'Value': `₹${pricing.bwCostPerPage}` },
      { 'Metric': 'Color Cost/Page', 'Value': `₹${pricing.colorCostPerPage}` },
    ];

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Orders sheet
    if (ordersData.length > 0) {
      const ordersWs = XLSX.utils.json_to_sheet(ordersData);
      ordersWs['!cols'] = [
        { wch: 6 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, 
        { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }
      ];
      XLSX.utils.book_append_sheet(wb, ordersWs, 'Orders');
    }

    // Expenses sheet
    if (expensesData.length > 0) {
      const expensesWs = XLSX.utils.json_to_sheet(expensesData);
      expensesWs['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 30 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, expensesWs, 'Expenses');
    }

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Return file
    const fileName = `FlashPrint_DailyReport_${format(date, 'yyyy-MM-dd')}.xlsx`;
    
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
