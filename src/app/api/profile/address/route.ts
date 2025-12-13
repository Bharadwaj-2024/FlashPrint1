import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      hostelName,
      roomNumber,
      departmentName,
      cabinNumber,
      buildingName,
      floorNumber,
      landmark,
      notes,
    } = body;

    // Check if address exists
    const existingAddress = await prisma.address.findUnique({
      where: { userId: session.user.id },
    });

    const addressData = {
      type,
      hostelName: type === 'Hostel' ? hostelName : null,
      roomNumber: type === 'Hostel' ? roomNumber : null,
      departmentName: type === 'Department' ? departmentName : null,
      cabinNumber: type === 'Department' ? cabinNumber : null,
      buildingName: type === 'Custom' ? buildingName : null,
      floorNumber: type === 'Custom' ? floorNumber : null,
      landmark: landmark || null,
      notes: notes || null,
    };

    let address;
    if (existingAddress) {
      address = await prisma.address.update({
        where: { userId: session.user.id },
        data: addressData,
      });
    } else {
      address = await prisma.address.create({
        data: {
          ...addressData,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const address = await prisma.address.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}
