import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const Schema = z.object({
  championTeamId: z.string().min(1).nullable().optional(),
  topScorerName: z.string().trim().min(1).max(60).nullable().optional(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nur Admin" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { championTeamId, topScorerName } = parsed.data;

  if (championTeamId) {
    const team = await prisma.team.findUnique({ where: { id: championTeamId } });
    if (!team) {
      return NextResponse.json({ error: "Unbekanntes Team" }, { status: 400 });
    }
  }

  const data: { championTeamId?: string | null; topScorerName?: string | null } = {};
  if (championTeamId !== undefined) data.championTeamId = championTeamId;
  if (topScorerName !== undefined) data.topScorerName = topScorerName ?? null;

  await prisma.tournament.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
