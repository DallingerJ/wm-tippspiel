import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SLOTS = ["R32-03","R32-09","R32-01","R32-04","R32-10","R32-02","R32-11","R32-12"];

async function main() {
  const matches = await prisma.match.findMany({
    where: { slot: { in: SLOTS } },
    include: { homeTeam: true, awayTeam: true },
  });
  const bySlot = new Map(matches.map((m) => [m.slot!, m]));

  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    include: { bets: true },
  });

  for (const u of users) {
    console.log(`\n=== ${u.name} ===`);
    for (const slot of SLOTS) {
      const m = bySlot.get(slot)!;
      const bet = u.bets.find((b) => b.matchId === m.id);
      const label = `${m.homeTeam?.name} vs ${m.awayTeam?.name}`.padEnd(34);
      if (bet) {
        console.log(`  ${label} ${bet.homeScoreBet}:${bet.awayScoreBet} [${bet.outcomeBet}] ${bet.points}P  ${m.isFinished ? "(beendet)" : "(offen)"}`);
      } else {
        console.log(`  ${label} — KEIN TIPP`);
      }
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
