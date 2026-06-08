import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Gleiche Fehlermeldung für "User unbekannt" und "Passwort falsch" (kein Account-Enumeration)
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "E-Mail oder Passwort ist falsch" },
      { status: 401 }
    );
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
}
