import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

const RegisterSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2).max(40),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, name, email, password } = parsed.data;

  // Einladung prüfen
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) {
    return NextResponse.json({ error: "Einladungslink ungültig" }, { status: 403 });
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Einladungslink abgelaufen" }, { status: 403 });
  }
  if (invite.maxUses != null && invite.uses >= invite.maxUses) {
    return NextResponse.json(
      { error: "Einladungslink ist bereits aufgebraucht" },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email: email.toLowerCase(), passwordHash: hashPassword(password) },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } },
      });
      return created;
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name } }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Diese E-Mail ist bereits registriert" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Registrierung fehlgeschlagen" }, { status: 500 });
  }
}
