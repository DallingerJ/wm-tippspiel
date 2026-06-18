import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { predictionsClosed } from "@/lib/predictions";

const Schema = z.object({
  championTeamId: z.string().min(1).nullable().optional(),
  topScorerBet: z.string().trim().min(1).max(60).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (predictionsClosed()) {
    return NextResponse.json(
      { error: "Turnier-Tipps sind seit dem 19.06.2026, 19:00 Uhr geschlossen" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { championTeamId, topScorerBet } = parsed.data;

  // WM-Sieger muss ein echtes Team sein
  if (championTeamId) {
    const team = await prisma.team.findUnique({ where: { id: championTeamId } });
    if (!team) {
      return NextResponse.json({ error: "Unbekanntes Team" }, { status: 400 });
    }
  }

  // Nur gesetzte Felder aktualisieren (beide Tipps sind unabhängig)
  const data: { championTeamId?: string | null; topScorerBet?: string | null } = {};
  if (championTeamId !== undefined) data.championTeamId = championTeamId;
  if (topScorerBet !== undefined) data.topScorerBet = topScorerBet ?? null;

  await prisma.user.update({ where: { id: user.id }, data });

  return NextResponse.json({ ok: true });
}
