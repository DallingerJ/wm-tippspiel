import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const r16 = await prisma.match.findMany({
    where: { round: "R16" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { slot: "asc" },
  });
  console.log("=== ACHTELFINALE (automatisch weitergeschaltet) ===");
  for (const m of r16) {
    console.log(`  ${m.slot}: ${m.homeTeam?.name ?? "[offen]"} vs ${m.awayTeam?.name ?? "[offen]"}`);
  }

  console.log("\n=== PUNKTE PRO SPIELER (KO-Tipps) ===");
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { points: "desc" },
    include: {
      bets: {
        where: { match: { round: { not: "GROUP" } }, points: { gt: 0 } },
        include: { match: { include: { homeTeam: true, awayTeam: true } } },
      },
    },
  });
  for (const u of users) {
    const koPts = u.bets.reduce((s, b) => s + b.points, 0);
    console.log(`\n  ${u.name}  (gesamt ${u.points} P, davon KO ${koPts} P):`);
    for (const b of u.bets) {
      console.log(
        `     ${b.match.homeTeam?.name} ${b.homeScoreBet}:${b.awayScoreBet} ${b.match.awayTeam?.name} [${b.outcomeBet}] -> ${b.points} P`
      );
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
