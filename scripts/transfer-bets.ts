/**
 * Überträgt genau die Admin-Tipps, bei denen Dobsen noch KEINEN Tipp hat,
 * auf Dobsen (verschieben). Danach Punkte aller User neu aggregieren.
 *
 *   npx tsx scripts/transfer-bets.ts          -> Dry-Run
 *   npx tsx scripts/transfer-bets.ts --apply  -> schreibt
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const dobsen = await prisma.user.findFirstOrThrow({ where: { name: "Dobsen" } });

  const adminBets = await prisma.bet.findMany({
    where: { userId: admin.id },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
  });

  // Übertragbar = Dobsen hat auf diesem Spiel noch keinen Tipp
  const toMove: typeof adminBets = [];
  for (const b of adminBets) {
    const conflict = await prisma.bet.findUnique({
      where: { userId_matchId: { userId: dobsen.id, matchId: b.matchId } },
    });
    if (!conflict) toMove.push(b);
  }

  console.log(`\n=== ${APPLY ? "APPLY" : "DRY-RUN"}: ${toMove.length} Tipps Admin -> Dobsen ===`);
  for (const b of toMove) {
    console.log(
      `  ${b.match.homeTeam?.name} vs ${b.match.awayTeam?.name}  ${b.homeScoreBet}:${b.awayScoreBet} [${b.outcomeBet}] ${b.points}P`
    );
  }
  const gained = toMove.reduce((s, b) => s + b.points, 0);
  console.log(`  Summe übertragener Punkte: ${gained}`);

  if (APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const b of toMove) {
        await tx.bet.update({ where: { id: b.id }, data: { userId: dobsen.id } });
      }
      // Punkte aller User neu aggregieren
      const users = await tx.user.findMany({ select: { id: true } });
      for (const u of users) {
        const agg = await tx.bet.aggregate({ where: { userId: u.id }, _sum: { points: true } });
        await tx.user.update({ where: { id: u.id }, data: { points: agg._sum.points ?? 0 } });
      }
    });
    console.log("\n✅ Übertragen + Punkte neu berechnet.\n");
  } else {
    console.log("\n(DRY-RUN – nichts geändert.)\n");
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
