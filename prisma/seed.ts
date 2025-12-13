import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flashprint.com' },
    update: {},
    create: {
      email: 'admin@flashprint.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91 9876543210',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create test student
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@college.edu' },
    update: {},
    create: {
      email: 'student@college.edu',
      name: 'Test Student',
      password: studentPassword,
      role: 'STUDENT',
      phone: '+91 9876543211',
      address: {
        create: {
          type: 'Hostel',
          hostelName: 'Boys Hostel A',
          roomNumber: '301',
          landmark: 'Near Canteen',
        },
      },
    },
  });
  console.log('✅ Created student user:', student.email);

  // Create test faculty
  const facultyPassword = await bcrypt.hash('faculty123', 12);
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@college.edu' },
    update: {},
    create: {
      email: 'faculty@college.edu',
      name: 'Dr. Test Faculty',
      password: facultyPassword,
      role: 'FACULTY',
      phone: '+91 9876543212',
      address: {
        create: {
          type: 'Department',
          departmentName: 'Computer Science',
          cabinNumber: '204',
        },
      },
    },
  });
  console.log('✅ Created faculty user:', faculty.email);

  // Create pricing configuration
  await prisma.pricingConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      bwPricePerPage: 3,
      colorPricePerPage: 12,
      doubleSidedDiscount: 0,
    },
  });
  console.log('✅ Created pricing configuration');

  // Create some sample orders for testing
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'FP-000001',
      userId: student.id,
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      totalAmount: 36,
      deliveryAddress: {
        type: 'Hostel',
        hostelName: 'Boys Hostel A',
        roomNumber: '301',
        landmark: 'Near Canteen',
      },
      items: {
        create: [
          {
            fileName: 'Assignment.pdf',
            fileUrl: 'https://example.com/files/assignment.pdf',
            pageCount: 10,
            printType: 'BW',
            paperSize: 'A4',
            printSide: 'SINGLE',
            copies: 1,
            price: 30,
          },
          {
            fileName: 'Report.pdf',
            fileUrl: 'https://example.com/files/report.pdf',
            pageCount: 2,
            printType: 'BW',
            paperSize: 'A4',
            printSide: 'SINGLE',
            copies: 1,
            price: 6,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: 'PENDING',
            changedBy: student.id,
            notes: 'Order placed',
          },
          {
            status: 'PAYMENT_CONFIRMED',
            changedBy: admin.id,
            notes: 'Payment verified',
          },
          {
            status: 'PRINTING',
            changedBy: admin.id,
            notes: 'Started printing',
          },
          {
            status: 'READY_FOR_DELIVERY',
            changedBy: admin.id,
            notes: 'Printing complete',
          },
          {
            status: 'OUT_FOR_DELIVERY',
            changedBy: admin.id,
            notes: 'Dispatched for delivery',
          },
          {
            status: 'DELIVERED',
            changedBy: admin.id,
            notes: 'Delivered successfully',
          },
        ],
      },
    },
  });
  console.log('✅ Created sample order:', sampleOrder.orderNumber);

  // Create a pending order
  const pendingOrder = await prisma.order.create({
    data: {
      orderNumber: 'FP-000002',
      userId: faculty.id,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      totalAmount: 120,
      deliveryAddress: {
        type: 'Department',
        departmentName: 'Computer Science',
        cabinNumber: '204',
      },
      items: {
        create: [
          {
            fileName: 'Lecture_Notes.pdf',
            fileUrl: 'https://example.com/files/lecture.pdf',
            pageCount: 10,
            printType: 'COLOR',
            paperSize: 'A4',
            printSide: 'SINGLE',
            copies: 1,
            price: 120,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: 'PENDING',
            changedBy: faculty.id,
            notes: 'Order placed',
          },
        ],
      },
    },
  });
  console.log('✅ Created pending order:', pendingOrder.orderNumber);

  console.log('');
  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('   Admin:   admin@flashprint.com / admin123');
  console.log('   Student: student@college.edu / student123');
  console.log('   Faculty: faculty@college.edu / faculty123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
