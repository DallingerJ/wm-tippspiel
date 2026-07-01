import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const ko = await prisma.match.findMany({
    where: { round: "R32" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { slot: "asc" },
  });

  // Duplikat-Check: jedes Team höchstens 1x in R32
  const seen = new Map<string, string[]>();
  for (const m of ko) {
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (!t) continue;
      if (!seen.has(t.name)) seen.set(t.name, []);
      seen.get(t.name)!.push(m.slot!);
    }
  }
  const dups = [...seen.entries()].filter(([, slots]) => slots.length > 1);
  console.log("=== DUPLIKAT-CHECK (R32) ===");
  if (dups.length === 0) console.log("  ✓ keine doppelten Teams");
  else dups.forEach(([name, slots]) => console.log(`  ✗ ${name} in ${slots.join(", ")}`));

  console.log("\n=== R32-SPIELE ===");
  for (const m of ko) {
    const h = m.homeTeam?.name ?? "[offen]";
    const a = m.awayTeam?.name ?? "[offen]";
    const s = m.homeScore != null ? `${m.homeScore}:${m.awayScore}` : "—";
    console.log(`  ${m.slot}: ${h} vs ${a}  = ${s}  ${m.isFinished ? "✓beendet" : ""}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
