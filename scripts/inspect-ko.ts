import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
  console.log("=== USERS ===");
  users.forEach((u) => console.log(`  ${u.name} [${u.role}] ${u.id}`));

  const groupCount = await prisma.match.count({ where: { round: "GROUP" } });
  const groupFinished = await prisma.match.count({ where: { round: "GROUP", isFinished: true } });
  console.log(`\n=== GRUPPE: ${groupFinished}/${groupCount} beendet ===`);

  const ko = await prisma.match.findMany({
    where: { round: { not: "GROUP" } },
    orderBy: { kickoff: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      favoriteTeam: true,
      _count: { select: { bets: true } },
    },
  });

  console.log(`\n=== KO-SPIELE (${ko.length}) ===`);
  for (const m of ko) {
    const home = m.homeTeam?.name ?? `[${m.homeSource ?? "?"}]`;
    const away = m.awayTeam?.name ?? `[${m.awaySource ?? "?"}]`;
    const score =
      m.homeScore != null ? `${m.homeScore}:${m.awayScore}` : "—";
    const fav = m.favoriteTeam?.name ?? (m.favoriteTeamId ? m.favoriteTeamId : "toss-up");
    const fin = m.isFinished ? "✓" : " ";
    console.log(
      `  [${fin}] ${m.slot?.padEnd(8) ?? m.round.padEnd(8)} ${home} vs ${away}  = ${score}  Fav=${fav}  Tipps=${m._count.bets}`
    );
  }

  // Bets pro KO-Match
  const koBets = await prisma.bet.findMany({
    where: { match: { round: { not: "GROUP" } } },
    include: { user: { select: { name: true } }, match: { include: { homeTeam: true, awayTeam: true } } },
  });
  console.log(`\n=== BESTEHENDE KO-TIPPS (${koBets.length}) ===`);
  for (const b of koBets) {
    console.log(
      `  ${b.user.name}: ${b.match.homeTeam?.name ?? "?"} vs ${b.match.awayTeam?.name ?? "?"}  ${b.homeScoreBet ?? "-"}:${b.awayScoreBet ?? "-"} 1x2=${b.outcomeBet ?? "-"} pts=${b.points}`
    );
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
