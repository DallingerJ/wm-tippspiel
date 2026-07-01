import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const NEEDED = [
  "Südafrika", "Kanada", "Brasilien", "Japan", "Deutschland", "Paraguay",
  "Niederlande", "Marokko", "Elfenbeinküste", "Norwegen", "Frankreich",
  "Schweden", "Mexiko", "Ecuador", "England", "DR Kongo", "Demokratische Republik Kongo",
];

async function main() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" }, select: { name: true, rating: true } });
  console.log("=== ALLE TEAMS ===");
  teams.forEach((t) => console.log(`  ${t.name.padEnd(28)} rating=${t.rating}`));

  const names = new Set(teams.map((t) => t.name));
  console.log("\n=== GESUCHTE TEAMS ===");
  for (const n of NEEDED) {
    console.log(`  ${names.has(n) ? "✓" : "✗ FEHLT"}  ${n}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
