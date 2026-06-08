import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const BetSchema = z
  .object({
    matchId: z.string().min(1),
    homeScoreBet: z.number().int().min(0).max(99).nullable().optional(),
    awayScoreBet: z.number().int().min(0).max(99).nullable().optional(),
    outcomeBet: z.enum(["HOME", "DRAW", "AWAY"]).nullable().optional(),
  })
  // Ergebnis nur komplett (beide Felder) oder gar nicht
  .refine(
    (b) => (b.homeScoreBet == null) === (b.awayScoreBet == null),
    { message: "Ergebnis-Tipp braucht beide Werte" }
  )
  // Mindestens ein Tipp-Teil muss vorhanden sein
  .refine(
    (b) => b.homeScoreBet != null || b.outcomeBet != null,
    { message: "Bitte Ergebnis und/oder 1X2 tippen" }
  );

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { matchId, homeScoreBet, awayScoreBet, outcomeBet } = parsed.data;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match nicht gefunden" }, { status: 404 });
  }
  // K.o.-Spiel ohne feststehende Teams ist noch nicht tippbar
  if (!match.homeTeamId || !match.awayTeamId) {
    return NextResponse.json(
      { error: "Teams stehen noch nicht fest" },
      { status: 409 }
    );
  }
  if (match.isFinished || match.kickoff <= new Date()) {
    return NextResponse.json(
      { error: "Tippabgabe für dieses Spiel ist bereits geschlossen" },
      { status: 409 }
    );
  }

  const data = {
    homeScoreBet: homeScoreBet ?? null,
    awayScoreBet: awayScoreBet ?? null,
    outcomeBet: outcomeBet ?? null,
  };

  const bet = await prisma.bet.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    create: { userId: user.id, matchId, ...data },
    update: data,
  });

  return NextResponse.json(bet, { status: 201 });
}
