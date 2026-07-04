/**
 * Korrigiert die Achtelfinal-Anstoßzeiten (echte Termine, MESZ = Wien UTC+2).
 *   npx tsx scripts/fix-r16-times.ts          -> Dry-Run
 *   npx tsx scripts/fix-r16-times.ts --apply  -> schreibt
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const at = (s: string) => new Date(`${s}+02:00`); // MESZ

const TIMES: Record<string, string> = {
  "R16-1": "2026-07-04T23:00:00", // Paraguay–Frankreich
  "R16-2": "2026-07-04T19:00:00", // Kanada–Marokko
  "R16-3": "2026-07-06T21:00:00", // Portugal–Spanien
  "R16-4": "2026-07-07T02:00:00", // USA–Belgien
  "R16-5": "2026-07-05T22:00:00", // Brasilien–Norwegen
  "R16-6": "2026-07-06T02:00:00", // Mexiko–England
  "R16-7": "2026-07-07T18:00:00", // Argentinien–Ägypten
  "R16-8": "2026-07-07T22:00:00", // Schweiz–Kolumbien
};

async function main() {
  console.log(`=== ${APPLY ? "APPLY" : "DRY-RUN"} ===`);
  for (const [slot, iso] of Object.entries(TIMES)) {
    const m = await prisma.match.findUniqueOrThrow({
      where: { slot },
      include: { homeTeam: true, awayTeam: true },
    });
    const label = `${m.homeTeam?.name ?? "[offen]"} vs ${m.awayTeam?.name ?? "[offen]"}`;
    console.log(`  ${slot} (${label}): ${m.kickoff.toISOString()} -> ${at(iso).toISOString()}`);
    if (APPLY) await prisma.match.update({ where: { slot }, data: { kickoff: at(iso) } });
  }
  console.log(APPLY ? "\n✅ Achtelfinal-Zeiten aktualisiert.\n" : "\n(DRY-RUN)\n");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
