/**
 * Baut die komplette Sechzehntelfinal-Runde (R32) exakt nach dem echten
 * Turnierbaum (Sportschau-Bild) auf: 16 Paarungen auf die richtigen Slots
 * (damit sich Achtel-/Viertel-/Halbfinale korrekt weiterschalten), echte
 * Anstoßzeiten (MESZ), Papier-Tipps auf die neuen Slots, 7 Ergebnisse abrechnen.
 *
 *   npx tsx scripts/fix-ko.ts          -> Dry-Run
 *   npx tsx scripts/fix-ko.ts --apply  -> schreibt in die DB
 */
import { PrismaClient } from "@prisma/client";
import { calculatePoints, getTendency, Tendency } from "../src/lib/scoring";
import { resolveBracket, favoriteFromRatings } from "../src/lib/bracket";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// MESZ (= Wien, UTC+2) -> Date
const at = (s: string) => new Date(`${s}+02:00`);

// --- Alle 16 R32-Spiele. Slot-Reihenfolge so gewählt, dass die App-Verdrahtung
//     (R16 = W-R32-(2n-1) vs W-R32-2n, QF, SF) exakt den Turnierbaum ergibt. ---
type Game = {
  slot: string;
  home: string;
  away: string;
  kickoff: string; // MESZ
  result?: [number, number];
};

const GAMES: Game[] = [
  // Linke Baumhälfte -> Slots 01–08 (SF-1)
  { slot: "R32-01", home: "Deutschland", away: "Paraguay", kickoff: "2026-06-29T22:30:00", result: [3, 4] },
  { slot: "R32-02", home: "Frankreich", away: "Schweden", kickoff: "2026-06-30T23:00:00", result: [3, 0] },
  { slot: "R32-03", home: "Südafrika", away: "Kanada", kickoff: "2026-06-28T21:00:00", result: [0, 1] },
  { slot: "R32-04", home: "Niederlande", away: "Marokko", kickoff: "2026-06-30T03:00:00", result: [2, 3] },
  { slot: "R32-05", home: "Portugal", away: "Kroatien", kickoff: "2026-07-03T01:00:00" },
  { slot: "R32-06", home: "Spanien", away: "Österreich", kickoff: "2026-07-02T21:00:00" },
  { slot: "R32-07", home: "USA", away: "Bosnien-Herzegowina", kickoff: "2026-07-02T02:00:00" },
  { slot: "R32-08", home: "Belgien", away: "Senegal", kickoff: "2026-07-01T22:00:00" },
  // Rechte Baumhälfte -> Slots 09–16 (SF-2)
  { slot: "R32-09", home: "Brasilien", away: "Japan", kickoff: "2026-06-29T19:00:00", result: [2, 1] },
  { slot: "R32-10", home: "Elfenbeinküste", away: "Norwegen", kickoff: "2026-06-30T19:00:00", result: [1, 2] },
  { slot: "R32-11", home: "Mexiko", away: "Ecuador", kickoff: "2026-07-01T04:00:00", result: [2, 0] },
  { slot: "R32-12", home: "England", away: "DR Kongo", kickoff: "2026-07-01T18:00:00" }, // Admin trägt Ergebnis ein
  { slot: "R32-13", home: "Argentinien", away: "Kap Verde", kickoff: "2026-07-04T00:00:00" },
  { slot: "R32-14", home: "Australien", away: "Ägypten", kickoff: "2026-07-03T20:00:00" },
  { slot: "R32-15", home: "Schweiz", away: "Algerien", kickoff: "2026-07-03T05:00:00" },
  { slot: "R32-16", home: "Kolumbien", away: "Ghana", kickoff: "2026-07-04T03:30:00" },
];

// --- Tipps je Spieler in ursprünglicher Reihenfolge (siehe TIP_SLOTS-Mapping) ---
const T = (s: string) => s.split(":").map(Number) as [number, number];
// Reihenfolge, in der die Tipps abgegeben wurden -> neuer Slot des jeweiligen Spiels
const TIP_SLOTS = ["R32-03", "R32-09", "R32-01", "R32-04", "R32-10", "R32-02", "R32-11", "R32-12"];
const TIPS: Record<string, [number, number][]> = {
  Dobsen: ["0:2", "3:2", "4:1", "2:1", "1:2", "4:1", "3:2", "3:1"].map(T),
  Felix: ["1:2", "2:1", "3:0", "2:1", "1:2", "4:1", "1:2", "3:0"].map(T),
  "Schneida Hons": ["0:2", "2:1", "3:1", "2:3", "1:3", "2:0", "0:1", "2:0"].map(T),
  Schuasta_Papa: ["1:3", "3:1", "2:0", "3:1", "1:2", "3:0", "3:1", "2:1"].map(T),
  Nokksn: ["1:2", "3:2", "3:1", "2:1", "2:3", "3:1", "2:1", "3:0"].map(T),
};

async function main() {
  const teams = await prisma.team.findMany();
  const teamByName = new Map(teams.map((t) => [t.name, t]));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const need = (n: string) => {
    const t = teamByName.get(n);
    if (!t) throw new Error(`Team fehlt: ${n}`);
    return t;
  };
  const users = await prisma.user.findMany();
  const userByName = new Map(users.map((u) => [u.name, u]));
  const slotIds = new Map(
    (await prisma.match.findMany({ select: { id: true, slot: true } }))
      .filter((m) => m.slot)
      .map((m) => [m.slot as string, m.id])
  );

  console.log(`\n=== ${APPLY ? "APPLY" : "DRY-RUN"} ===\n`);

  await prisma.$transaction(
    async (tx) => {
      // 1) Alte KO-Tipps löschen (Slots ändern sich -> saubere Neuvergabe)
      if (APPLY) {
        const del = await tx.bet.deleteMany({ where: { match: { round: { not: "GROUP" } } } });
        console.log(`  [Reset] ${del.count} alte KO-Tipps gelöscht`);
      }

      // 2) R16+ Teams/Favorit zurücksetzen (Sources bleiben -> resolveBracket füllt neu)
      if (APPLY) {
        await tx.match.updateMany({
          where: { round: { in: ["R16", "QF", "SF", "THIRD", "FINAL"] } },
          data: { homeTeamId: null, awayTeamId: null, favoriteTeamId: null, isFinished: false,
                  homeScore: null, awayScore: null, penaltyWinnerTeamId: null },
        });
      }

      // 3) 16 R32-Paarungen + Favorit + echte Anstoßzeit setzen, Sources lösen
      for (const g of GAMES) {
        const home = need(g.home);
        const away = need(g.away);
        const fav = favoriteFromRatings(home, away);
        console.log(
          `  [R32] ${g.slot}: ${home.name} vs ${away.name}  @${g.kickoff} MESZ  Fav=${fav ? teamById.get(fav)!.name : "toss-up"}`
        );
        if (APPLY) {
          await tx.match.update({
            where: { slot: g.slot },
            data: {
              homeTeamId: home.id,
              awayTeamId: away.id,
              favoriteTeamId: fav,
              homeSource: null,
              awaySource: null,
              kickoff: at(g.kickoff),
              isFinished: false,
              homeScore: null,
              awayScore: null,
              penaltyWinnerTeamId: null,
            },
          });
        }
      }

      // 4) Tipps neu einfügen (Ergebnis + abgeleitete 1X2-Tendenz), auf neue Slots
      for (const [playerName, tipList] of Object.entries(TIPS)) {
        const user = userByName.get(playerName);
        if (!user) throw new Error(`User fehlt: ${playerName}`);
        for (let i = 0; i < TIP_SLOTS.length; i++) {
          const [h, a] = tipList[i];
          const outcome = getTendency(h, a);
          const matchId = slotIds.get(TIP_SLOTS[i])!;
          if (APPLY) {
            await tx.bet.create({
              data: { userId: user.id, matchId, homeScoreBet: h, awayScoreBet: a, outcomeBet: outcome },
            });
          }
        }
      }
      console.log(`  [Tipps] ${Object.keys(TIPS).length} Spieler × ${TIP_SLOTS.length} Spiele eingetragen`);

      // 5) Ergebnisse eintragen + Tipps bewerten
      for (const g of GAMES) {
        if (!g.result) continue;
        const [hs, as] = g.result;
        const match = await tx.match.findUniqueOrThrow({
          where: { slot: g.slot },
          include: { bets: true },
        });
        console.log(`  [Ergebnis] ${g.slot}: ${g.home} ${hs}:${as} ${g.away}`);
        if (APPLY) {
          await tx.match.update({
            where: { id: match.id },
            data: { homeScore: hs, awayScore: as, isFinished: true },
          });
          for (const bet of match.bets) {
            const pts = calculatePoints(
              {
                homeScoreBet: bet.homeScoreBet,
                awayScoreBet: bet.awayScoreBet,
                outcomeBet: (bet.outcomeBet as Tendency | null) ?? null,
              },
              {
                homeTeamId: match.homeTeamId!,
                awayTeamId: match.awayTeamId!,
                favoriteTeamId: match.favoriteTeamId,
                homeScore: hs,
                awayScore: as,
              }
            );
            await tx.bet.update({ where: { id: bet.id }, data: { points: pts } });
          }
        }
      }

      // 6) User-Punkte neu aggregieren + Bracket weiterschalten
      if (APPLY) {
        for (const u of users) {
          const agg = await tx.bet.aggregate({ where: { userId: u.id }, _sum: { points: true } });
          await tx.user.update({ where: { id: u.id }, data: { points: agg._sum.points ?? 0 } });
        }
        await resolveBracket(tx);
      }
    },
    { maxWait: 20000, timeout: 120000 }
  );

  console.log(APPLY ? "\n✅ Geschrieben.\n" : "\n(DRY-RUN – nichts geändert.)\n");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
