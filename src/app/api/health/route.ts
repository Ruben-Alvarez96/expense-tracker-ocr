import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  console.log("=== HEALTH CHECK STARTED ===");
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);
  
  try {
    console.log("Attempting database connection...");
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Basic query successful");
    
    // Test user table access
    const userCount = await prisma.user.count();
    console.log("✅ User table accessible, count:", userCount);
    
    // Test category table access
    const categoryCount = await prisma.category.count();
    console.log("✅ Category table accessible, count:", categoryCount);
    
    return NextResponse.json({ 
      status: "healthy", 
      database: "connected",
      userCount,
      categoryCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Health check failed:", error);
    console.error("Error type:", error instanceof Error ? error.constructor.name : "Unknown");
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error code:", (error as any).code);
    console.error("Error meta:", (error as any).meta);
    
    return NextResponse.json({ 
      status: "unhealthy", 
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      errorCode: (error as any).code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
