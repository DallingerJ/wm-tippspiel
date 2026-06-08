import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

/** Identische Hash-Logik wie src/lib/auth.ts (Seed hat keinen Next-Kontext). */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// ---------------------------------------------------------------------------
// Echte WM-2026-Daten (Endauslosung). Quellen: Wikipedia / ESPN, Stand Juni 2026.
// rating = grobe Stärke-Einschätzung -> bestimmt automatisch den Favoriten.
// (Keine offiziellen Quoten; nur eine plausible Heuristik für die Punktelogik.)
// ---------------------------------------------------------------------------
type TeamSeed = { name: string; code: string; rating: number; group: string };

const TEAMS: TeamSeed[] = [
  // Gruppe A
  { name: "Mexiko", code: "mx", rating: 78, group: "A" },
  { name: "Südafrika", code: "za", rating: 70, group: "A" },
  { name: "Südkorea", code: "kr", rating: 76, group: "A" },
  { name: "Tschechien", code: "cz", rating: 73, group: "A" },
  // Gruppe B
  { name: "Kanada", code: "ca", rating: 73, group: "B" },
  { name: "Bosnien-Herzegowina", code: "ba", rating: 72, group: "B" },
  { name: "Katar", code: "qa", rating: 68, group: "B" },
  { name: "Schweiz", code: "ch", rating: 80, group: "B" },
  // Gruppe C
  { name: "Brasilien", code: "br", rating: 91, group: "C" },
  { name: "Marokko", code: "ma", rating: 83, group: "C" },
  { name: "Haiti", code: "ht", rating: 62, group: "C" },
  { name: "Schottland", code: "gb-sct", rating: 73, group: "C" },
  // Gruppe D
  { name: "USA", code: "us", rating: 79, group: "D" },
  { name: "Paraguay", code: "py", rating: 72, group: "D" },
  { name: "Australien", code: "au", rating: 72, group: "D" },
  { name: "Türkei", code: "tr", rating: 78, group: "D" },
  // Gruppe E
  { name: "Deutschland", code: "de", rating: 88, group: "E" },
  { name: "Curaçao", code: "cw", rating: 62, group: "E" },
  { name: "Elfenbeinküste", code: "ci", rating: 75, group: "E" },
  { name: "Ecuador", code: "ec", rating: 76, group: "E" },
  // Gruppe F
  { name: "Niederlande", code: "nl", rating: 89, group: "F" },
  { name: "Japan", code: "jp", rating: 80, group: "F" },
  { name: "Schweden", code: "se", rating: 74, group: "F" },
  { name: "Tunesien", code: "tn", rating: 72, group: "F" },
  // Gruppe G
  { name: "Belgien", code: "be", rating: 87, group: "G" },
  { name: "Ägypten", code: "eg", rating: 74, group: "G" },
  { name: "Iran", code: "ir", rating: 74, group: "G" },
  { name: "Neuseeland", code: "nz", rating: 64, group: "G" },
  // Gruppe H
  { name: "Spanien", code: "es", rating: 93, group: "H" },
  { name: "Kap Verde", code: "cv", rating: 66, group: "H" },
  { name: "Saudi-Arabien", code: "sa", rating: 66, group: "H" },
  { name: "Uruguay", code: "uy", rating: 84, group: "H" },
  // Gruppe I
  { name: "Frankreich", code: "fr", rating: 94, group: "I" },
  { name: "Senegal", code: "sn", rating: 80, group: "I" },
  { name: "Irak", code: "iq", rating: 65, group: "I" },
  { name: "Norwegen", code: "no", rating: 78, group: "I" },
  // Gruppe J
  { name: "Argentinien", code: "ar", rating: 95, group: "J" },
  { name: "Algerien", code: "dz", rating: 75, group: "J" },
  { name: "Österreich", code: "at", rating: 77, group: "J" },
  { name: "Jordanien", code: "jo", rating: 66, group: "J" },
  // Gruppe K
  { name: "Portugal", code: "pt", rating: 90, group: "K" },
  { name: "DR Kongo", code: "cd", rating: 70, group: "K" },
  { name: "Usbekistan", code: "uz", rating: 67, group: "K" },
  { name: "Kolumbien", code: "co", rating: 83, group: "K" },
  // Gruppe L
  { name: "England", code: "gb-eng", rating: 92, group: "L" },
  { name: "Kroatien", code: "hr", rating: 84, group: "L" },
  { name: "Ghana", code: "gh", rating: 73, group: "L" },
  { name: "Panama", code: "pa", rating: 66, group: "L" },
];

// Alle 72 Gruppenspiele: [Gruppe, Heim, Auswärts, Kickoff (ET = UTC-4)]
const FIXTURES: [string, string, string, string][] = [
  // Spieltag 1
  ["A", "Mexiko", "Südafrika", "2026-06-11T15:00:00-04:00"],
  ["A", "Südkorea", "Tschechien", "2026-06-11T22:00:00-04:00"],
  ["B", "Kanada", "Bosnien-Herzegowina", "2026-06-12T15:00:00-04:00"],
  ["D", "USA", "Paraguay", "2026-06-12T21:00:00-04:00"],
  ["B", "Katar", "Schweiz", "2026-06-13T15:00:00-04:00"],
  ["C", "Brasilien", "Marokko", "2026-06-13T18:00:00-04:00"],
  ["C", "Haiti", "Schottland", "2026-06-13T21:00:00-04:00"],
  ["D", "Australien", "Türkei", "2026-06-14T00:00:00-04:00"],
  ["E", "Deutschland", "Curaçao", "2026-06-14T13:00:00-04:00"],
  ["F", "Niederlande", "Japan", "2026-06-14T16:00:00-04:00"],
  ["E", "Elfenbeinküste", "Ecuador", "2026-06-14T19:00:00-04:00"],
  ["F", "Schweden", "Tunesien", "2026-06-14T22:00:00-04:00"],
  ["H", "Spanien", "Kap Verde", "2026-06-15T13:00:00-04:00"],
  ["G", "Belgien", "Ägypten", "2026-06-15T18:00:00-04:00"],
  ["H", "Saudi-Arabien", "Uruguay", "2026-06-15T18:00:00-04:00"],
  ["G", "Iran", "Neuseeland", "2026-06-16T00:00:00-04:00"],
  ["I", "Frankreich", "Senegal", "2026-06-16T15:00:00-04:00"],
  ["I", "Irak", "Norwegen", "2026-06-16T18:00:00-04:00"],
  ["J", "Argentinien", "Algerien", "2026-06-16T21:00:00-04:00"],
  ["J", "Österreich", "Jordanien", "2026-06-17T00:00:00-04:00"],
  ["K", "Portugal", "DR Kongo", "2026-06-17T13:00:00-04:00"],
  ["L", "England", "Kroatien", "2026-06-17T16:00:00-04:00"],
  ["L", "Ghana", "Panama", "2026-06-17T19:00:00-04:00"],
  ["K", "Usbekistan", "Kolumbien", "2026-06-17T22:00:00-04:00"],
  // Spieltag 2
  ["A", "Tschechien", "Südafrika", "2026-06-18T12:00:00-04:00"],
  ["B", "Schweiz", "Bosnien-Herzegowina", "2026-06-18T15:00:00-04:00"],
  ["B", "Kanada", "Katar", "2026-06-18T18:00:00-04:00"],
  ["A", "Mexiko", "Südkorea", "2026-06-18T23:00:00-04:00"],
  ["D", "USA", "Australien", "2026-06-19T15:00:00-04:00"],
  ["C", "Schottland", "Marokko", "2026-06-19T18:00:00-04:00"],
  ["C", "Brasilien", "Haiti", "2026-06-19T21:00:00-04:00"],
  ["D", "Türkei", "Paraguay", "2026-06-20T00:00:00-04:00"],
  ["F", "Niederlande", "Schweden", "2026-06-20T13:00:00-04:00"],
  ["E", "Deutschland", "Elfenbeinküste", "2026-06-20T16:00:00-04:00"],
  ["E", "Ecuador", "Curaçao", "2026-06-20T20:00:00-04:00"],
  ["F", "Tunesien", "Japan", "2026-06-21T00:00:00-04:00"],
  ["H", "Spanien", "Saudi-Arabien", "2026-06-21T12:00:00-04:00"],
  ["G", "Belgien", "Iran", "2026-06-21T15:00:00-04:00"],
  ["H", "Uruguay", "Kap Verde", "2026-06-21T18:00:00-04:00"],
  ["G", "Neuseeland", "Ägypten", "2026-06-21T21:00:00-04:00"],
  ["J", "Argentinien", "Österreich", "2026-06-22T13:00:00-04:00"],
  ["I", "Frankreich", "Irak", "2026-06-22T17:00:00-04:00"],
  ["I", "Norwegen", "Senegal", "2026-06-22T20:00:00-04:00"],
  ["J", "Jordanien", "Algerien", "2026-06-22T23:00:00-04:00"],
  ["K", "Portugal", "Usbekistan", "2026-06-23T13:00:00-04:00"],
  ["L", "England", "Ghana", "2026-06-23T16:00:00-04:00"],
  ["L", "Panama", "Kroatien", "2026-06-23T19:00:00-04:00"],
  ["K", "Kolumbien", "DR Kongo", "2026-06-23T22:00:00-04:00"],
  // Spieltag 3 (zeitgleiche Anstöße je Gruppe)
  ["B", "Schweiz", "Kanada", "2026-06-24T15:00:00-04:00"],
  ["B", "Bosnien-Herzegowina", "Katar", "2026-06-24T15:00:00-04:00"],
  ["C", "Schottland", "Brasilien", "2026-06-24T18:00:00-04:00"],
  ["C", "Marokko", "Haiti", "2026-06-24T18:00:00-04:00"],
  ["A", "Tschechien", "Mexiko", "2026-06-24T21:00:00-04:00"],
  ["A", "Südafrika", "Südkorea", "2026-06-24T21:00:00-04:00"],
  ["E", "Ecuador", "Deutschland", "2026-06-25T16:00:00-04:00"],
  ["E", "Curaçao", "Elfenbeinküste", "2026-06-25T16:00:00-04:00"],
  ["F", "Japan", "Schweden", "2026-06-25T19:00:00-04:00"],
  ["F", "Tunesien", "Niederlande", "2026-06-25T19:00:00-04:00"],
  ["D", "Türkei", "USA", "2026-06-25T22:00:00-04:00"],
  ["D", "Paraguay", "Australien", "2026-06-25T22:00:00-04:00"],
  ["I", "Norwegen", "Frankreich", "2026-06-26T15:00:00-04:00"],
  ["I", "Senegal", "Irak", "2026-06-26T15:00:00-04:00"],
  ["H", "Kap Verde", "Saudi-Arabien", "2026-06-26T20:00:00-04:00"],
  ["H", "Uruguay", "Spanien", "2026-06-26T20:00:00-04:00"],
  ["G", "Ägypten", "Iran", "2026-06-26T23:00:00-04:00"],
  ["G", "Neuseeland", "Belgien", "2026-06-26T23:00:00-04:00"],
  ["L", "Panama", "England", "2026-06-27T17:00:00-04:00"],
  ["L", "Kroatien", "Ghana", "2026-06-27T17:00:00-04:00"],
  ["K", "Kolumbien", "Portugal", "2026-06-27T19:30:00-04:00"],
  ["K", "DR Kongo", "Usbekistan", "2026-06-27T19:30:00-04:00"],
  ["J", "Algerien", "Österreich", "2026-06-27T22:00:00-04:00"],
  ["J", "Jordanien", "Argentinien", "2026-06-27T22:00:00-04:00"],
];

// K.o.-Bracket (vollständig verdrahtetes Template). round/slot/Quellen + Termine.
// Quellen: W-x = Gruppensieger, R-x = Gruppenzweiter, T-n = bester Dritter (Rang n),
//          W-SLOT = Sieger dieses Spiels, L-SLOT = Verlierer (Spiel um Platz 3).
// Hinweis: Rundenstruktur + Termine sind echt; die genaue Dritten-Zuordnung der
// FIFA-Kombinationstabelle wird hier bewusst vereinfacht (bestes Template).
type KoSeed = { round: string; slot: string; home: string; away: string; kickoff: string };

const KNOCKOUT: KoSeed[] = [
  // Sechzehntelfinale (R32) – 28.06.–03.07.
  { round: "R32", slot: "R32-01", home: "W-A", away: "T-1", kickoff: "2026-06-28T15:00:00-04:00" },
  { round: "R32", slot: "R32-02", home: "W-B", away: "T-2", kickoff: "2026-06-28T19:00:00-04:00" },
  { round: "R32", slot: "R32-03", home: "W-C", away: "T-3", kickoff: "2026-06-29T13:00:00-04:00" },
  { round: "R32", slot: "R32-04", home: "W-D", away: "T-4", kickoff: "2026-06-29T16:00:00-04:00" },
  { round: "R32", slot: "R32-05", home: "W-E", away: "T-5", kickoff: "2026-06-29T19:00:00-04:00" },
  { round: "R32", slot: "R32-06", home: "W-F", away: "T-6", kickoff: "2026-06-30T13:00:00-04:00" },
  { round: "R32", slot: "R32-07", home: "W-G", away: "T-7", kickoff: "2026-06-30T17:00:00-04:00" },
  { round: "R32", slot: "R32-08", home: "W-H", away: "T-8", kickoff: "2026-06-30T21:00:00-04:00" },
  { round: "R32", slot: "R32-09", home: "W-I", away: "R-J", kickoff: "2026-07-01T12:00:00-04:00" },
  { round: "R32", slot: "R32-10", home: "W-J", away: "R-I", kickoff: "2026-07-01T16:00:00-04:00" },
  { round: "R32", slot: "R32-11", home: "W-K", away: "R-L", kickoff: "2026-07-01T20:00:00-04:00" },
  { round: "R32", slot: "R32-12", home: "W-L", away: "R-K", kickoff: "2026-07-02T15:00:00-04:00" },
  { round: "R32", slot: "R32-13", home: "R-A", away: "R-B", kickoff: "2026-07-02T19:00:00-04:00" },
  { round: "R32", slot: "R32-14", home: "R-C", away: "R-D", kickoff: "2026-07-02T23:00:00-04:00" },
  { round: "R32", slot: "R32-15", home: "R-E", away: "R-F", kickoff: "2026-07-03T18:00:00-04:00" },
  { round: "R32", slot: "R32-16", home: "R-G", away: "R-H", kickoff: "2026-07-03T21:30:00-04:00" },
  // Achtelfinale (R16) – 04.–07.07.
  { round: "R16", slot: "R16-1", home: "W-R32-01", away: "W-R32-02", kickoff: "2026-07-04T12:00:00-04:00" },
  { round: "R16", slot: "R16-2", home: "W-R32-03", away: "W-R32-04", kickoff: "2026-07-04T16:00:00-04:00" },
  { round: "R16", slot: "R16-3", home: "W-R32-05", away: "W-R32-06", kickoff: "2026-07-05T12:00:00-04:00" },
  { round: "R16", slot: "R16-4", home: "W-R32-07", away: "W-R32-08", kickoff: "2026-07-05T16:00:00-04:00" },
  { round: "R16", slot: "R16-5", home: "W-R32-09", away: "W-R32-10", kickoff: "2026-07-06T15:00:00-04:00" },
  { round: "R16", slot: "R16-6", home: "W-R32-11", away: "W-R32-12", kickoff: "2026-07-06T19:00:00-04:00" },
  { round: "R16", slot: "R16-7", home: "W-R32-13", away: "W-R32-14", kickoff: "2026-07-07T15:00:00-04:00" },
  { round: "R16", slot: "R16-8", home: "W-R32-15", away: "W-R32-16", kickoff: "2026-07-07T19:00:00-04:00" },
  // Viertelfinale (QF) – 09.–11.07.
  { round: "QF", slot: "QF-1", home: "W-R16-1", away: "W-R16-2", kickoff: "2026-07-09T15:00:00-04:00" },
  { round: "QF", slot: "QF-2", home: "W-R16-3", away: "W-R16-4", kickoff: "2026-07-09T19:00:00-04:00" },
  { round: "QF", slot: "QF-3", home: "W-R16-5", away: "W-R16-6", kickoff: "2026-07-10T15:00:00-04:00" },
  { round: "QF", slot: "QF-4", home: "W-R16-7", away: "W-R16-8", kickoff: "2026-07-11T15:00:00-04:00" },
  // Halbfinale (SF) – 14./15.07.
  { round: "SF", slot: "SF-1", home: "W-QF-1", away: "W-QF-2", kickoff: "2026-07-14T15:00:00-04:00" },
  { round: "SF", slot: "SF-2", home: "W-QF-3", away: "W-QF-4", kickoff: "2026-07-15T15:00:00-04:00" },
  // Spiel um Platz 3 – 18.07. / Finale – 19.07.
  { round: "THIRD", slot: "THIRD", home: "L-SF-1", away: "L-SF-2", kickoff: "2026-07-18T15:00:00-04:00" },
  { round: "FINAL", slot: "FINAL", home: "W-SF-1", away: "W-SF-2", kickoff: "2026-07-19T15:00:00-04:00" },
];

/** Favorit = klar stärkeres Team; bei knapper Differenz Toss-up (null). */
function favoriteId(
  home: { id: string; rating: number },
  away: { id: string; rating: number }
): string | null {
  const diff = home.rating - away.rating;
  if (Math.abs(diff) < 4) return null; // Toss-up -> Sieg zählt als Außenseiter (6 P)
  return diff > 0 ? home.id : away.id;
}

async function main() {
  // Sauberer Reset (idempotenter Seed)
  await prisma.bet.deleteMany();
  await prisma.match.deleteMany();
  await prisma.session.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Teams
  const teams = new Map<string, { id: string; rating: number }>();
  for (const t of TEAMS) {
    const created = await prisma.team.create({
      data: {
        name: t.name,
        code: t.code,
        rating: t.rating,
        group: t.group,
        flagUrl: `https://flagcdn.com/w80/${t.code}.png`,
      },
    });
    teams.set(t.name, { id: created.id, rating: t.rating });
  }

  // Gruppenspiele
  for (const [group, homeName, awayName, kickoff] of FIXTURES) {
    const home = teams.get(homeName)!;
    const away = teams.get(awayName)!;
    await prisma.match.create({
      data: {
        round: "GROUP",
        group,
        kickoff: new Date(kickoff),
        homeTeamId: home.id,
        awayTeamId: away.id,
        favoriteTeamId: favoriteId(home, away),
      },
    });
  }

  // K.o.-Runde: Teams anfangs offen (TBD), per homeSource/awaySource verdrahtet.
  // resolveBracket() füllt sie automatisch, sobald Ergebnisse eingetragen werden.
  for (const ko of KNOCKOUT) {
    await prisma.match.create({
      data: {
        round: ko.round,
        slot: ko.slot,
        kickoff: new Date(ko.kickoff),
        homeSource: ko.home,
        awaySource: ko.away,
      },
    });
  }

  // Admin-Account (kann Ergebnisse eintragen + Einladungen erstellen)
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@tippspiel.local",
      passwordHash: hashPassword("admin1234"),
      role: "ADMIN",
    },
  });

  // Wiederverwendbarer Start-Einladungslink
  const invite = await prisma.invite.create({
    data: { token: randomBytes(12).toString("hex"), label: "Start-Einladung", createdById: admin.id },
  });

  console.log("✅ Seed abgeschlossen:");
  console.log(
    `   ${TEAMS.length} Teams, ${FIXTURES.length} Gruppenspiele + ${KNOCKOUT.length} K.o.-Spiele`
  );
  console.log(`   Admin-Login: admin@tippspiel.local / admin1234`);
  console.log(`   Einladungslink: /join/${invite.token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
