import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveDailyOrdersToExcel, getDailyExcelPath, getAvailableDailyReports } from '@/lib/excel-export';
import { parseISO, format } from 'date-fns';
import * as fs from 'fs';

// GET - List available reports or download a specific report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const dateStr = searchParams.get('date');

    // List all available reports
    if (action === 'list') {
      const reports = getAvailableDailyReports();
      return NextResponse.json({ reports });
    }

    // Download specific date's report
    if (dateStr) {
      const date = parseISO(dateStr);
      let filePath = getDailyExcelPath(date);

      // If file doesn't exist, generate it
      if (!filePath) {
        filePath = await saveDailyOrdersToExcel(date);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileName = `FlashPrint_Orders_${format(date, 'yyyy-MM-dd')}.xlsx`;

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Default: Download today's report
    let filePath = getDailyExcelPath(new Date());
    if (!filePath) {
      filePath = await saveDailyOrdersToExcel();
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `FlashPrint_Orders_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error fetching Excel report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

// POST - Regenerate report for a specific date
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date: dateStr } = body;

    const date = dateStr ? parseISO(dateStr) : new Date();
    const filePath = await saveDailyOrdersToExcel(date);

    return NextResponse.json({
      success: true,
      message: `Report generated successfully`,
      filePath,
      date: format(date, 'yyyy-MM-dd'),
    });
  } catch (error) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
