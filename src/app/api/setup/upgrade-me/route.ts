import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This endpoint upgrades the current user to ADMIN
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Update current user to ADMIN
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { role: 'ADMIN' },
    });

    // Also ensure pricing config exists
    await prisma.pricingConfig.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        bwPricePerPage: 3,
        colorPricePerPage: 12,
        doubleSidedDiscount: 0,
        bwCostPerPage: 1,
        colorCostPerPage: 5,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'You are now an ADMIN! Please sign out and sign back in.',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error upgrading to admin:', error);
    return NextResponse.json({ error: 'Failed to upgrade' }, { status: 500 });
  }
}
