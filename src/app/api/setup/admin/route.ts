import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// This endpoint creates/updates the admin user
// Only works in development or with a secret key
export async function POST(request: NextRequest) {
  try {
    // Get setup key from environment or request
    const body = await request.json().catch(() => ({}));
    const setupKey = body.setupKey || '';
    
    // In production, require a setup key
    if (process.env.NODE_ENV === 'production' && setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 });
    }

    const email = body.email || 'admin@flashprint.com';
    const password = body.password || 'admin123';
    const name = body.name || 'Admin';

    const hashedPassword = await hash(password, 12);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
        name,
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Also create default pricing config
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
      message: 'Admin user created successfully',
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      credentials: {
        email,
        password,
      },
    });
  } catch (error) {
    console.error('Error setting up admin:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to create admin user',
    example: {
      email: 'admin@flashprint.com',
      password: 'admin123',
      name: 'Admin',
    },
  });
}
