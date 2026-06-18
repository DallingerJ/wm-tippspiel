/**
 * Punkte-Audit: Rechnet für JEDEN Tipp die Punkte neu aus den echten Ergebnissen
 * und gleicht die User-Gesamtpunkte ab. Quelle der Wahrheit = die Tipps + Resultate,
 * NICHT die (evtl. händisch veränderten) gespeicherten Punktewerte.
 *
 *   npx tsx scripts/recompute-points.ts          -> nur Bericht (dry-run)
 *   npx tsx scripts/recompute-points.ts --apply  -> Korrekturen schreiben
 */
import { PrismaClient } from "@prisma/client";
import { calculatePoints, Tendency } from "../src/lib/scoring";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, points: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));
  const correctTotal = new Map<string, number>();
  users.forEach((u) => correctTotal.set(u.id, 0));

  const bets = await prisma.bet.findMany({ include: { match: true } });

  const betFixes: { id: string; user: string; old: number; correct: number }[] = [];

  for (const bet of bets) {
    const m = bet.match;
    let correct = 0;

    const scored =
      m.isFinished &&
      m.homeScore != null &&
      m.awayScore != null &&
      m.homeTeamId &&
      m.awayTeamId;

    if (scored) {
      correct = calculatePoints(
        {
          homeScoreBet: bet.homeScoreBet,
          awayScoreBet: bet.awayScoreBet,
          outcomeBet: (bet.outcomeBet as Tendency | null) ?? null,
        },
        {
          homeTeamId: m.homeTeamId!,
          awayTeamId: m.awayTeamId!,
          favoriteTeamId: m.favoriteTeamId,
          homeScore: m.homeScore!,
          awayScore: m.awayScore!,
        }
      );
    }

    correctTotal.set(bet.userId, (correctTotal.get(bet.userId) ?? 0) + correct);

    if ((bet.points ?? 0) !== correct) {
      betFixes.push({
        id: bet.id,
        user: userById.get(bet.userId)?.name ?? bet.userId,
        old: bet.points ?? 0,
        correct,
      });
    }
  }

  // ---- Bericht: einzelne Tipps ----
  console.log(`\n=== TIPP-EBENE: ${betFixes.length} falsche Tipp-Punkte ===`);
  for (const f of betFixes) {
    console.log(`  ${f.user}: Tipp ${f.id}  ${f.old} -> ${f.correct}`);
  }

  // ---- Bericht: User-Gesamtpunkte ----
  console.log(`\n=== USER-EBENE (gespeichert -> korrekt) ===`);
  const userFixes: { id: string; name: string; old: number; correct: number }[] = [];
  for (const u of users) {
    const correct = correctTotal.get(u.id) ?? 0;
    const flag = u.points === correct ? "ok " : "FIX";
    if (u.points !== correct) userFixes.push({ id: u.id, name: u.name, old: u.points, correct });
    console.log(`  [${flag}] ${u.name}: ${u.points} -> ${correct}`);
  }

  console.log(
    `\nZusammenfassung: ${userFixes.length}/${users.length} User mit falschem Gesamtstand, ` +
      `${betFixes.length} Tipps mit falschen Punkten.`
  );

  if (!APPLY) {
    console.log(`\n(DRY-RUN – nichts geändert. Mit  --apply  schreiben.)`);
    return;
  }

  // ---- Korrekturen schreiben ----
  await prisma.$transaction(async (tx) => {
    for (const f of betFixes) {
      await tx.bet.update({ where: { id: f.id }, data: { points: f.correct } });
    }
    for (const f of userFixes) {
      await tx.user.update({ where: { id: f.id }, data: { points: f.correct } });
    }
  });
  console.log(
    `\n✅ Geschrieben: ${betFixes.length} Tipp-Punkte + ${userFixes.length} User-Gesamtstände korrigiert.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
