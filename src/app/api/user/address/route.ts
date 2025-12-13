import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for student form data
const studentFormSchema = z.object({
  fullName: z.string().min(2),
  branch: z.string().min(1),
  semester: z.string().min(1),
  classNumber: z.string().min(1),
  block: z.string().min(1),
  roomLocation: z.string().min(1),
  phoneNumber: z.string().min(10),
  role: z.literal('STUDENT'),
});

// Schema for faculty form data
const facultyFormSchema = z.object({
  fullName: z.string().min(2),
  department: z.string().min(1),
  officeNumber: z.string().min(1),
  block: z.string().min(1),
  roomLocation: z.string().min(1),
  phoneNumber: z.string().min(10),
  role: z.literal('FACULTY'),
});

// Schema for others form data
const othersFormSchema = z.object({
  fullName: z.string().min(2),
  block: z.string().min(1),
  roomLocation: z.string().min(1),
  phoneNumber: z.string().min(10),
  role: z.literal('OTHERS'),
});

const addressSchema = z.union([studentFormSchema, facultyFormSchema, othersFormSchema]);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // Transform form data to address model structure
    let addressData: {
      type: string;
      hostelName: string | null;
      roomNumber: string | null;
      departmentName: string | null;
      cabinNumber: string | null;
      buildingName: string | null;
      floorNumber: string | null;
      landmark: string | null;
      notes: string | null;
    };

    if (validatedData.role === 'STUDENT') {
      // Check if block is a hostel
      const isHostel = validatedData.block.toLowerCase().includes('hostel');
      addressData = {
        type: isHostel ? 'Hostel' : 'Custom',
        hostelName: isHostel ? validatedData.block : null,
        roomNumber: validatedData.roomLocation,
        departmentName: 'branch' in validatedData ? validatedData.branch : null,
        cabinNumber: 'classNumber' in validatedData ? validatedData.classNumber : null,
        buildingName: !isHostel ? validatedData.block : null,
        floorNumber: null,
        landmark: 'semester' in validatedData ? `Semester ${validatedData.semester}` : null,
        notes: null,
      };
    } else if (validatedData.role === 'FACULTY') {
      addressData = {
        type: 'Department',
        hostelName: null,
        roomNumber: null,
        departmentName: 'department' in validatedData ? validatedData.department : null,
        cabinNumber: 'officeNumber' in validatedData ? validatedData.officeNumber : null,
        buildingName: validatedData.block,
        floorNumber: null,
        landmark: validatedData.roomLocation,
        notes: null,
      };
    } else {
      addressData = {
        type: 'Custom',
        hostelName: null,
        roomNumber: null,
        departmentName: null,
        cabinNumber: null,
        buildingName: validatedData.block,
        floorNumber: null,
        landmark: validatedData.roomLocation,
        notes: null,
      };
    }

    // Check if address already exists
    const existingAddress = await prisma.address.findUnique({
      where: { userId: session.user.id },
    });

    if (existingAddress) {
      // Update existing address
      const address = await prisma.address.update({
        where: { userId: session.user.id },
        data: addressData,
      });

      // Update user name, phone, and role
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          name: validatedData.fullName,
          phone: validatedData.phoneNumber,
          role: validatedData.role,
        },
      });

      return NextResponse.json({ message: 'Address updated', address });
    }

    // Create new address
    const address = await prisma.address.create({
      data: {
        ...addressData,
        userId: session.user.id,
      },
    });

    // Update user name, phone, and role
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        name: validatedData.fullName,
        phone: validatedData.phoneNumber,
        role: validatedData.role,
      },
    });

    return NextResponse.json({ message: 'Address created', address }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { message: 'Invalid data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Address save error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const address = await prisma.address.findUnique({
      where: { userId: session.user.id },
    });

    if (!address) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Address fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
