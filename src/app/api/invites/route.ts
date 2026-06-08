import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const CreateInviteSchema = z.object({
  label: z.string().max(60).optional(),
  maxUses: z.number().int().min(1).max(1000).nullable().optional(),
});

/** POST /api/invites — erzeugt einen Einladungslink (nur Admin). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nur Admins dürfen einladen" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CreateInviteSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const token = randomBytes(12).toString("hex");
  const invite = await prisma.invite.create({
    data: {
      token,
      label: parsed.data.label,
      maxUses: parsed.data.maxUses ?? null,
      createdById: user.id,
    },
  });

  return NextResponse.json({ token: invite.token }, { status: 201 });
}
