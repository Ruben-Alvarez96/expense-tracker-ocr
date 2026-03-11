import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Log environment variables (without sensitive data)
console.log("=== PRISMA INITIALIZATION ===");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);
console.log("DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 20) + "...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("==============================");

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Test connection immediately
prisma.$connect()
  .then(() => {
    console.log("✅ Prisma connected successfully to database");
  })
  .catch((error) => {
    console.error("❌ Prisma connection failed:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  });
