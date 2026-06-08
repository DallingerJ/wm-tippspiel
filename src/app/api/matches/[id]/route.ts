import { NextResponse } from "next/server";
import { z } from "zod";
import { settleMatch } from "@/lib/settleMatch";
import { getCurrentUser } from "@/lib/auth";

const ResultSchema = z.object({
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
  penaltyWinnerTeamId: z.string().min(1).nullable().optional(), // K.o. bei Remis
});

/**
 * PATCH /api/matches/:id
 * Trägt das Endergebnis ein und rechnet alle Tipps ab. Nur für Admins.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nur für Admins" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const affectedBets = await settleMatch(params.id, parsed.data);
    return NextResponse.json({ ok: true, affectedBets });
  } catch (err) {
    return NextResponse.json(
      { error: "Match konnte nicht abgerechnet werden" },
      { status: 404 }
    );
  }
}
