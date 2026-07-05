import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword, signSession, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Fill in every field to continue." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password) },
  });

  const response = NextResponse.json({ id: user.id, email: user.email, name: user.name });
  response.cookies.set(SESSION_COOKIE_NAME, signSession(user.id), SESSION_COOKIE_OPTIONS);
  return response;
}
