import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Optimized Prisma client with connection pooling
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  });

// Reuse connection in all environments
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export default prisma;
