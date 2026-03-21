import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { expenses } = await req.json();

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json({ error: "Gastos invalidos o vacios" }, { status: 400 });
    }

    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
    const defaultCategoryId = categories[0]?.id;

    if (!defaultCategoryId) {
      return NextResponse.json({ error: "No hay categorias configuradas" }, { status: 400 });
    }

    const expensesToCreate = expenses.map((exp: any) => ({
      userId: session.id,
      amount: Number(exp.amount) || 0,
      description: exp.description || "Gasto sin descripcion",
      date: exp.date ? new Date(exp.date) : new Date(),
      categoryId: categoryMap.get(exp.category) || defaultCategoryId,
    }));

    const result = await prisma.expense.createMany({
      data: expensesToCreate,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk save error:", error);
    return NextResponse.json({ error: "Error al guardar los gastos" }, { status: 500 });
  }
}
