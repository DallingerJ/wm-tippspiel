import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const dobsen = await prisma.user.findFirstOrThrow({ where: { name: "Dobsen" } });

  const adminBets = await prisma.bet.findMany({
    where: { userId: admin.id },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
  });

  console.log(`=== ADMIN (${admin.name}) hat ${adminBets.length} Tipps ===`);
  for (const b of adminBets) {
    const m = b.match;
    const phase = m.group ? `Gruppe ${m.group}` : m.round;
    const dobsenHas = await prisma.bet.findUnique({
      where: { userId_matchId: { userId: dobsen.id, matchId: m.id } },
    });
    console.log(
      `  [${phase}] ${m.homeTeam?.name ?? "?"} vs ${m.awayTeam?.name ?? "?"}  Tipp ${b.homeScoreBet}:${b.awayScoreBet} [${b.outcomeBet}] ${b.points}P` +
        `  ${m.isFinished ? "(beendet)" : "(offen)"}  ${dobsenHas ? "⚠️ DOBSEN HAT SCHON TIPP" : "→ frei für Dobsen"}`
    );
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
