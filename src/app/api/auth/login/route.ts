import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  console.log("=== LOGIN ATTEMPT ===");
  
  try {
    const { email, password } = await req.json();
    console.log("Login request for email:", email);

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    console.log("Looking for user in database...");
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("User found:", !!user);
    
    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    console.log("Comparing password...");
    const valid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", valid);

    if (!valid) {
      console.log("❌ Invalid password");
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    console.log("Creating JWT token...");
    const token = signToken({ id: user.id, email: user.email });

    console.log("✅ Login successful");
    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al iniciar sesion" }, { status: 500 });
  }
}
