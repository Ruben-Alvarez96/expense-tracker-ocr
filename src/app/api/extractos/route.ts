import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
// @ts-ignore
import * as pdfParseLib from "pdf-parse";
const pdfParse = (pdfParseLib as any).default || pdfParseLib;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envio ningun documento" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = "";
    try {
      const data = await pdfParse(buffer);
      text = data.text;
    } catch (parseError) {
      console.error("Error parsing PDF:", parseError);
      return NextResponse.json({ error: "No se pudo leer el PDF." }, { status: 400 });
    }

    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    const categoryNames = categories.map((c: any) => c.name);

    const systemPrompt = `Eres un asistente experto en analizar extractos bancarios y de tarjetas de credito.
Tu tarea es extraer TODOS los gastos, consumos y pagos realizados (ignorando depositos, ingresos de saldo, cobro de salarios o movimientos similares de ingreso).
Devuelve SOLO un array JSON valido de objetos (sin bloques de codigo extra o markdown) con la siguiente estructura para cada gasto encontrado en el extracto:
[
  {
    "amount": numero con el monto del gasto (siempre positivo). ATENCION: El punto (.) es un separador de miles en esta moneda (ej: 10.000 significa 10000). Omite los puntos al devolver el numero,
    "description": "nombre del comercio o concepto descriptivo del gasto corto",
    "category": "clasifica en una de estas categorias: ${categoryNames.join(", ")}. Si ninguna encaja perfecto, elige la mas parecida.",
    "date": "fecha del gasto en formato YYYY-MM-DD. Si solo ves dia y mes, asume el año correspondiente segun el texto."
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extrae los gastos y devuelvelos en formato JSON literal:\n\n${text}` }
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    
    let expenses = [];
    try {
        const jsonStr = content.replace(/```json?\n?/ig, "").replace(/```/g, "").trim();
        expenses = JSON.parse(jsonStr);
    } catch (err) {
      console.error("Error parsing JSON:", err, "Content:", content);
      return NextResponse.json({ error: "Error al entender la respuesta de la IA." }, { status: 500 });
    }

    return NextResponse.json({ expenses });

  } catch (error) {
    console.error("Statement extraction error:", error);
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 });
  }
}
