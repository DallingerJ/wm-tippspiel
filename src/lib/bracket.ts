import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Reine Helfer (ohne DB) – auch in Server-Komponenten nutzbar
// ---------------------------------------------------------------------------

const ROUND_NAMES: Record<string, string> = {
  GROUP: "Gruppenphase",
  R32: "Sechzehntelfinale",
  R16: "Achtelfinale",
  QF: "Viertelfinale",
  SF: "Halbfinale",
  THIRD: "Spiel um Platz 3",
  FINAL: "Finale",
};

const ROUND_SHORT: Record<string, string> = {
  R32: "Sechzehntelf.",
  R16: "Achtelf.",
  QF: "Viertelf.",
  SF: "Halbf.",
  THIRD: "Spiel um Platz 3",
  FINAL: "Finale",
};

export function roundName(round: string): string {
  return ROUND_NAMES[round] ?? round;
}

/** Lesbare Bezeichnung für eine noch offene Team-Quelle, z.B. "Sieger Gruppe A". */
export function sourceLabel(source: string | null): string {
  if (!source) return "offen";
  if (source.startsWith("W-R") || source.startsWith("W-Q") || source.startsWith("W-S")) {
    const slot = source.slice(2);
    return `Sieger ${slotLabel(slot)}`;
  }
  if (source.startsWith("L-")) {
    return `Verlierer ${slotLabel(source.slice(2))}`;
  }
  if (source.startsWith("W-")) return `Sieger Gruppe ${source.slice(2)}`;
  if (source.startsWith("R-")) return `2. Gruppe ${source.slice(2)}`;
  if (source.startsWith("T-")) return `Bester Dritter ${source.slice(2)}`;
  return source;
}

function slotLabel(slot: string): string {
  // "R32-01" -> "Sechzehntelf. 1", "QF-3" -> "Viertelf. 3", "SF-1" -> "Halbf. 1"
  const [round, num] = slot.split("-");
  const name = ROUND_SHORT[round] ?? round;
  return num ? `${name} ${Number(num)}` : name;
}

/** Favorit aus den Stärke-Ratings; bei knapper Differenz Toss-up (null). */
export function favoriteFromRatings(
  home: { id: string; rating: number },
  away: { id: string; rating: number }
): string | null {
  const diff = home.rating - away.rating;
  if (Math.abs(diff) < 4) return null;
  return diff > 0 ? home.id : away.id;
}

// ---------------------------------------------------------------------------
// Tabellenberechnung
// ---------------------------------------------------------------------------

type TeamLite = { id: string; rating: number; name: string };
type MatchLite = {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
};
export type Standing = { teamId: string; points: number; gd: number; gf: number; name: string };

type Stats = { points: number; gd: number; gf: number };

/**
 * Summiert Punkte/Tordifferenz/Tore – aber nur aus Spielen, bei denen BEIDE
 * Teams in `ids` enthalten sind. Mit allen Gruppen-IDs = Gesamttabelle, mit
 * den IDs punktgleicher Teams = direkter Vergleich (Head-to-Head).
 */
function accumulate(ids: Set<string>, matches: MatchLite[]): Map<string, Stats> {
  const table = new Map<string, Stats>();
  for (const id of ids) table.set(id, { points: 0, gd: 0, gf: 0 });

  for (const m of matches) {
    if (!m.isFinished || m.homeScore == null || m.awayScore == null) continue;
    if (!m.homeTeamId || !m.awayTeamId) continue;
    const h = table.get(m.homeTeamId);
    const a = table.get(m.awayTeamId);
    if (!h || !a) continue; // mindestens ein Team nicht in der betrachteten Menge

    h.gf += m.homeScore;
    a.gf += m.awayScore;
    h.gd += m.homeScore - m.awayScore;
    a.gd += m.awayScore - m.homeScore;

    if (m.homeScore > m.awayScore) h.points += 3;
    else if (m.homeScore < m.awayScore) a.points += 3;
    else {
      h.points += 1;
      a.points += 1;
    }
  }

  return table;
}

/**
 * Offizielle FIFA-Reihenfolge der Gruppentabelle:
 *  1. Punkte (alle Gruppenspiele)
 *  2. Tordifferenz (alle Gruppenspiele)
 *  3. erzielte Tore (alle Gruppenspiele)
 *  4. Direkter Vergleich der punktgleichen Teams: Punkte -> Tordifferenz ->
 *     erzielte Tore, jeweils NUR aus den Spielen untereinander.
 *  (Bleiben Teams danach exakt gleich, entscheidet der Name als deterministischer
 *   Notnagel – offiziell käme hier Fair-Play-Wertung bzw. Losentscheid.)
 */
export function computeGroupOrder(teams: TeamLite[], matches: MatchLite[]): Standing[] {
  const overall = accumulate(new Set(teams.map((t) => t.id)), matches);

  const standings: Standing[] = teams.map((t) => {
    const s = overall.get(t.id)!;
    return { teamId: t.id, points: s.points, gd: s.gd, gf: s.gf, name: t.name };
  });

  // 1)–3) Gesamtkriterien
  standings.sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf);

  // 4) Gruppen exakt gleicher Teams per direktem Vergleich auflösen
  const result: Standing[] = [];
  for (let i = 0; i < standings.length; ) {
    let j = i + 1;
    while (
      j < standings.length &&
      standings[j].points === standings[i].points &&
      standings[j].gd === standings[i].gd &&
      standings[j].gf === standings[i].gf
    ) {
      j++;
    }

    const tied = standings.slice(i, j);
    if (tied.length > 1) {
      const h2h = accumulate(new Set(tied.map((s) => s.teamId)), matches);
      tied.sort((x, y) => {
        const hx = h2h.get(x.teamId)!;
        const hy = h2h.get(y.teamId)!;
        return (
          hy.points - hx.points ||
          hy.gd - hx.gd ||
          hy.gf - hx.gf ||
          x.name.localeCompare(y.name)
        );
      });
    }

    result.push(...tied);
    i = j;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Bracket-Auflösung: füllt TBD-K.o.-Spiele automatisch
// ---------------------------------------------------------------------------

/** Sieger eines beendeten K.o.-Spiels (bei Remis via Elfmeter-Auswahl). */
function knockoutWinner(m: {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinnerTeamId: string | null;
}): string | null {
  if (m.homeScore == null || m.awayScore == null || !m.homeTeamId || !m.awayTeamId) return null;
  if (m.homeScore > m.awayScore) return m.homeTeamId;
  if (m.homeScore < m.awayScore) return m.awayTeamId;
  return m.penaltyWinnerTeamId ?? null; // Remis -> braucht Elfmeter-Sieger
}

/**
 * Löst alle auflösbaren K.o.-Paarungen auf Basis der bisher eingetragenen
 * Ergebnisse auf. Idempotent: füllt nur noch offene Teams (überschreibt nicht).
 * Wird nach jedem Ergebnis-Eintrag innerhalb der Settle-Transaktion aufgerufen,
 * sodass der Admin ausschließlich Ergebnisse pflegen muss.
 */
export async function resolveBracket(tx: Prisma.TransactionClient): Promise<void> {
  const teams = await tx.team.findMany();
  const matches = await tx.match.findMany();
  const teamById = new Map(teams.map((t) => [t.id, t]));

  const resolver = new Map<string, string>(); // Quelle -> teamId

  // 1) Gruppentabellen (nur bei vollständig gespielter Gruppe)
  const groupLetters = Array.from(
    new Set(teams.map((t) => t.group).filter((g): g is string => !!g))
  );
  const thirds: Standing[] = [];
  let allGroupsDone = true;

  for (const letter of groupLetters) {
    const gTeams = teams
      .filter((t) => t.group === letter)
      .map((t) => ({ id: t.id, rating: t.rating, name: t.name }));
    const gMatches = matches.filter((m) => m.round === "GROUP" && m.group === letter);
    const complete = gMatches.length > 0 && gMatches.every((m) => m.isFinished);

    if (!complete) {
      allGroupsDone = false;
      continue;
    }
    const order = computeGroupOrder(gTeams, gMatches);
    if (order[0]) resolver.set(`W-${letter}`, order[0].teamId);
    if (order[1]) resolver.set(`R-${letter}`, order[1].teamId);
    if (order[2]) thirds.push(order[2]);
  }

  // 2) Beste Dritte (erst wenn alle Gruppen durch sind) -> T-1 .. T-8
  if (allGroupsDone && thirds.length > 0) {
    const ranked = [...thirds].sort(
      (x, y) =>
        y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name)
    );
    ranked.slice(0, 8).forEach((s, i) => resolver.set(`T-${i + 1}`, s.teamId));
  }

  // 3) Sieger/Verlierer bereits gespielter K.o.-Spiele
  for (const m of matches) {
    if (m.round === "GROUP" || !m.slot || !m.isFinished) continue;
    const winner = knockoutWinner(m);
    if (!winner) continue;
    resolver.set(`W-${m.slot}`, winner);
    const loser = m.homeTeamId === winner ? m.awayTeamId : m.homeTeamId;
    if (loser) resolver.set(`L-${m.slot}`, loser);
  }

  // 4) Offene K.o.-Spiele füllen (mehrere Durchläufe, da Runden aufeinander aufbauen)
  for (let pass = 0; pass < groupLetters.length + 8; pass++) {
    let changed = false;

    for (const m of matches) {
      if (m.round === "GROUP") continue;

      const data: Prisma.MatchUpdateInput = {};
      let nextHome = m.homeTeamId;
      let nextAway = m.awayTeamId;

      if (!m.homeTeamId && m.homeSource && resolver.has(m.homeSource)) {
        nextHome = resolver.get(m.homeSource)!;
        data.homeTeam = { connect: { id: nextHome } };
      }
      if (!m.awayTeamId && m.awaySource && resolver.has(m.awaySource)) {
        nextAway = resolver.get(m.awaySource)!;
        data.awayTeam = { connect: { id: nextAway } };
      }

      // Sobald beide Teams feststehen: Favorit aus Ratings ableiten
      if (nextHome && nextAway && !m.favoriteTeamId) {
        const fav = favoriteFromRatings(teamById.get(nextHome)!, teamById.get(nextAway)!);
        if (fav) data.favoriteTeam = { connect: { id: fav } };
        m.favoriteTeamId = fav;
      }

      if (Object.keys(data).length > 0) {
        await tx.match.update({ where: { id: m.id }, data });
        m.homeTeamId = nextHome;
        m.awayTeamId = nextAway;
        changed = true;
      }
    }

    if (!changed) break;
  }
}
