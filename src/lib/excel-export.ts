import { prisma } from '@/lib/prisma';
import { format, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface OrderExportData {
  'S.No': number;
  'Order Number': string;
  'Order Date': string;
  'Order Time': string;
  'Customer Name': string;
  'Customer Email': string;
  'Customer Phone': string;
  'Copies': number;
  'Total Pages': number;
  'B&W Pages': number;
  'Color Pages': number;
  'Amount (₹)': number;
  'Payment Status': string;
  'Order Status': string;
  'Delivery Address': string;
}

interface DailySummary {
  'Metric': string;
  'Value': string | number;
}

// Get the exports directory path
function getExportsDir(): string {
  const exportsDir = path.join(process.cwd(), 'exports', 'daily-reports');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  return exportsDir;
}

// Generate Excel file name for a date
function getExcelFileName(date: Date): string {
  return `FlashPrint_Orders_${format(date, 'yyyy-MM-dd')}.xlsx`;
}

// Format delivery address from JSON
function formatDeliveryAddress(addressJson: any): string {
  if (!addressJson) return 'N/A';
  
  const parts: string[] = [];
  
  if (addressJson.type === 'Hostel' && addressJson.hostelName) {
    parts.push(addressJson.hostelName);
    if (addressJson.roomNumber) parts.push(`Room ${addressJson.roomNumber}`);
  } else if (addressJson.type === 'Department' && addressJson.departmentName) {
    parts.push(addressJson.departmentName);
    if (addressJson.cabinNumber) parts.push(`Cabin ${addressJson.cabinNumber}`);
  } else if (addressJson.buildingName) {
    parts.push(addressJson.buildingName);
    if (addressJson.floorNumber) parts.push(`Floor ${addressJson.floorNumber}`);
  }
  
  if (addressJson.landmark) parts.push(addressJson.landmark);
  
  return parts.length > 0 ? parts.join(', ') : 'N/A';
}

// Save/Update daily orders Excel file
export async function saveDailyOrdersToExcel(date?: Date): Promise<string> {
  const targetDate = date || new Date();
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  // Get pricing config
  const pricingDb = await prisma.pricingConfig.findUnique({
    where: { id: 'default' }
  });

  const pricing = {
    bwPricePerPage: pricingDb?.bwPricePerPage ?? 3,
    colorPricePerPage: pricingDb?.colorPricePerPage ?? 12,
    bwCostPerPage: pricingDb?.bwCostPerPage ?? 1,
    colorCostPerPage: pricingDb?.colorCostPerPage ?? 5
  };

  // Get all orders for the day
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: dayStart,
        lte: dayEnd
      }
    },
    include: {
      items: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Get daily expenses
  const expenses = await prisma.dailyExpense.findMany({
    where: {
      date: dayStart
    }
  });

  // Calculate totals
  let totalOrders = orders.length;
  let totalCopies = 0;
  let totalPages = 0;
  let bwPages = 0;
  let colorPages = 0;
  let grossRevenue = 0;
  let pendingPayments = 0;
  let completedPayments = 0;

  // Prepare orders data for Excel
  const ordersData: OrderExportData[] = orders.map((order, index) => {
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

    if (order.paymentStatus === 'COMPLETED') {
      completedPayments += order.totalAmount;
    } else if (order.paymentStatus === 'PENDING') {
      pendingPayments += order.totalAmount;
    }

    return {
      'S.No': index + 1,
      'Order Number': order.orderNumber,
      'Order Date': format(order.createdAt, 'dd/MM/yyyy'),
      'Order Time': format(order.createdAt, 'hh:mm a'),
      'Customer Name': order.user?.name || 'Unknown',
      'Customer Email': order.user?.email || 'Unknown',
      'Customer Phone': order.user?.phone || 'N/A',
      'Copies': orderCopies,
      'Total Pages': orderPages,
      'B&W Pages': orderBwPages,
      'Color Pages': orderColorPages,
      'Amount (₹)': order.totalAmount,
      'Payment Status': order.paymentStatus,
      'Order Status': order.status,
      'Delivery Address': formatDeliveryAddress(order.deliveryAddress)
    };
  });

  // Calculate costs and profit
  const productionCost = (bwPages * pricing.bwCostPerPage) + (colorPages * pricing.colorCostPerPage);
  const otherExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossRevenue - productionCost - otherExpenses;

  // Prepare daily summary
  const summaryData: DailySummary[] = [
    { 'Metric': 'Report Date', 'Value': format(targetDate, 'dd MMMM yyyy, EEEE') },
    { 'Metric': 'Generated At', 'Value': format(new Date(), 'dd/MM/yyyy hh:mm a') },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '═══ ORDER SUMMARY ═══', 'Value': '' },
    { 'Metric': 'Total Orders', 'Value': totalOrders },
    { 'Metric': 'Total Copies', 'Value': totalCopies },
    { 'Metric': 'Total Pages Printed', 'Value': totalPages },
    { 'Metric': 'B&W Pages', 'Value': bwPages },
    { 'Metric': 'Color Pages', 'Value': colorPages },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '═══ REVENUE BREAKDOWN ═══', 'Value': '' },
    { 'Metric': 'Gross Revenue', 'Value': `₹${grossRevenue.toFixed(2)}` },
    { 'Metric': 'Payments Received', 'Value': `₹${completedPayments.toFixed(2)}` },
    { 'Metric': 'Payments Pending', 'Value': `₹${pendingPayments.toFixed(2)}` },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '═══ COST ANALYSIS ═══', 'Value': '' },
    { 'Metric': 'Production Cost', 'Value': `₹${productionCost.toFixed(2)}` },
    { 'Metric': 'Other Expenses', 'Value': `₹${otherExpenses.toFixed(2)}` },
    { 'Metric': 'Total Costs', 'Value': `₹${(productionCost + otherExpenses).toFixed(2)}` },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '═══ PROFIT ═══', 'Value': '' },
    { 'Metric': 'NET PROFIT', 'Value': `₹${netProfit.toFixed(2)}` },
    { 'Metric': 'Profit Margin', 'Value': grossRevenue > 0 ? `${((netProfit / grossRevenue) * 100).toFixed(1)}%` : '0%' },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '═══ PRICING CONFIG ═══', 'Value': '' },
    { 'Metric': 'B&W Price/Page', 'Value': `₹${pricing.bwPricePerPage}` },
    { 'Metric': 'Color Price/Page', 'Value': `₹${pricing.colorPricePerPage}` },
    { 'Metric': 'B&W Cost/Page', 'Value': `₹${pricing.bwCostPerPage}` },
    { 'Metric': 'Color Cost/Page', 'Value': `₹${pricing.colorCostPerPage}` }
  ];

  // Prepare expenses data
  const expensesData = expenses.map((exp, index) => ({
    'S.No': index + 1,
    'Category': exp.category.toUpperCase(),
    'Description': exp.description || '-',
    'Amount (₹)': exp.amount
  }));

  // Prepare order status breakdown
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    'Status': status.replace(/_/g, ' '),
    'Count': count
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Daily Summary');

  // Orders sheet
  if (ordersData.length > 0) {
    const ordersWs = XLSX.utils.json_to_sheet(ordersData);
    ordersWs['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 15 }, // Order Number
      { wch: 12 }, // Order Date
      { wch: 10 }, // Order Time
      { wch: 20 }, // Customer Name
      { wch: 28 }, // Customer Email
      { wch: 15 }, // Customer Phone
      { wch: 8 },  // Copies
      { wch: 12 }, // Total Pages
      { wch: 12 }, // B&W Pages
      { wch: 12 }, // Color Pages
      { wch: 12 }, // Amount
      { wch: 15 }, // Payment Status
      { wch: 18 }, // Order Status
      { wch: 35 }  // Delivery Address
    ];
    XLSX.utils.book_append_sheet(wb, ordersWs, 'All Orders');
  } else {
    // Add empty orders sheet with headers
    const emptyOrdersWs = XLSX.utils.aoa_to_sheet([
      ['S.No', 'Order Number', 'Order Date', 'Order Time', 'Customer Name', 'Customer Email', 'Customer Phone', 'Copies', 'Total Pages', 'B&W Pages', 'Color Pages', 'Amount (₹)', 'Payment Status', 'Order Status', 'Delivery Address'],
      ['No orders for this date']
    ]);
    XLSX.utils.book_append_sheet(wb, emptyOrdersWs, 'All Orders');
  }

  // Status breakdown sheet
  if (statusData.length > 0) {
    const statusWs = XLSX.utils.json_to_sheet(statusData);
    statusWs['!cols'] = [{ wch: 25 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, statusWs, 'Status Breakdown');
  }

  // Expenses sheet
  if (expensesData.length > 0) {
    const expensesWs = XLSX.utils.json_to_sheet(expensesData);
    expensesWs['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 35 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, expensesWs, 'Daily Expenses');
  }

  // Save to file
  const exportsDir = getExportsDir();
  const fileName = getExcelFileName(targetDate);
  const filePath = path.join(exportsDir, fileName);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  fs.writeFileSync(filePath, excelBuffer);

  console.log(`Daily orders Excel saved: ${filePath}`);

  // Also update the DailyReport in database
  await prisma.dailyReport.upsert({
    where: { date: dayStart },
    update: {
      totalOrders,
      totalCopies,
      totalPages,
      bwPages,
      colorPages,
      grossRevenue,
      productionCost,
      otherExpenses,
      netProfit,
      updatedAt: new Date()
    },
    create: {
      date: dayStart,
      totalOrders,
      totalCopies,
      totalPages,
      bwPages,
      colorPages,
      grossRevenue,
      productionCost,
      otherExpenses,
      netProfit
    }
  });

  return filePath;
}

// Get the Excel file for a specific date
export function getDailyExcelPath(date: Date): string | null {
  const exportsDir = getExportsDir();
  const fileName = getExcelFileName(date);
  const filePath = path.join(exportsDir, fileName);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  return null;
}

// Get list of all available daily reports
export function getAvailableDailyReports(): string[] {
  const exportsDir = getExportsDir();
  
  if (!fs.existsSync(exportsDir)) {
    return [];
  }

  return fs.readdirSync(exportsDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
    .reverse();
}
