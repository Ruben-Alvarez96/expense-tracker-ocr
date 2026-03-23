import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Se requiere un array de IDs" }, { status: 400 });
    }

    // Ensure we only delete expenses belonging to the current user
    const result = await prisma.expense.deleteMany({
      where: {
        id: { in: ids },
        userId: session.id,
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Error al eliminar gastos" }, { status: 500 });
  }
}
