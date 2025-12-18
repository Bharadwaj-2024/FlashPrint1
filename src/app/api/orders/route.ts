import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber, calculatePrintCost } from '@/lib/utils';
import { saveDailyOrdersToExcel } from '@/lib/excel-export';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const userId = session.user.id;

    // Get user's address for delivery
    const address = await prisma.address.findUnique({
      where: { userId },
    });

    if (!address) {
      return NextResponse.json(
        { message: 'Please set up your delivery address first' },
        { status: 400 }
      );
    }

    // Process files and options
    const items: Array<{
      fileName: string;
      fileUrl: string;
      pageCount: number;
      copies: number;
      printType: 'BW' | 'COLOR';
      paperSize: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL';
      printSide: 'SINGLE' | 'DOUBLE';
      price: number;
    }> = [];

    let totalAmount = 0;

    // Iterate through the form data
    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
      if (key.startsWith('file-')) {
        const index = key.split('-')[1];
        const optionsStr = formData.get(`options-${index}`) as string;
        const options = JSON.parse(optionsStr);

        const file = value as File;
        
        // In production, upload to S3/R2
        // For now, we'll store a placeholder URL
        const fileUrl = `/uploads/${Date.now()}-${file.name}`;

        const pages = options.pageRange
          ? parsePageRange(options.pageRange, options.pageCount).length
          : options.pageCount;
        
        const price = calculatePrintCost(
          pages,
          options.copies,
          options.printType,
          options.printSide
        );

        items.push({
          fileName: file.name,
          fileUrl,
          pageCount: options.pageCount,
          copies: options.copies,
          printType: options.printType,
          paperSize: options.paperSize,
          printSide: options.printSide,
          price,
        });

        totalAmount += price;
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: 'PENDING',
        deliveryAddress: {
          type: address.type,
          hostelName: address.hostelName,
          roomNumber: address.roomNumber,
          departmentName: address.departmentName,
          cabinNumber: address.cabinNumber,
          buildingName: address.buildingName,
          floorNumber: address.floorNumber,
          landmark: address.landmark,
          notes: address.notes,
        },
        totalAmount,
        paymentStatus: 'PENDING',
        items: {
          create: items,
        },
        statusHistory: {
          create: {
            status: 'PENDING',
            notes: 'Order placed successfully',
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Auto-save to daily Excel report (non-blocking)
    saveDailyOrdersToExcel().catch(err => {
      console.error('Failed to update daily Excel report:', err);
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const where: any = { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
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
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

function parsePageRange(range: string, total: number): number[] {
  if (!range.trim()) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: number[] = [];
  range.split(',').forEach((part) => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= Math.min(end, total); i++) pages.push(i);
    } else {
      const page = parseInt(part);
      if (page <= total) pages.push(page);
    }
  });
  return [...new Set(pages)].sort((a, b) => a - b);
}
