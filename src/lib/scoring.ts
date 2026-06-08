export type Tendency = "HOME" | "DRAW" | "AWAY";

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  favoriteTeamId: string | null;
}

export interface BetInput {
  homeScoreBet?: number | null;
  awayScoreBet?: number | null;
  outcomeBet?: Tendency | null;
}

/** Tendenz (1X2) eines Ergebnisses. */
export function getTendency(home: number, away: number): Tendency {
  if (home > away) return "HOME";
  if (home < away) return "AWAY";
  return "DRAW";
}

/** Punktwert für eine korrekt getippte Tendenz – mit Außenseiter-Bonus. */
export function tendencyPoints(actual: Tendency, match: MatchResult): number {
  if (actual === "DRAW") return 4;
  const winnerTeamId = actual === "HOME" ? match.homeTeamId : match.awayTeamId;
  // Favoritensieg = 3, Außenseiter-/Toss-up-Sieg = 6
  return winnerTeamId === match.favoriteTeamId ? 3 : 6;
}

/**
 * Ergebnis-Tipp und 1X2-Tipp werden UNABHÄNGIG gewertet und addiert:
 *  - Exaktes Ergebnis getippt:            +10 Punkte
 *  - 1X2-Tendenz korrekt getippt:         +3 / +4 / +6 (Favorit / Remis / Außenseiter)
 * Beide Teile sind optional. Maximal also 10 + 6 = 16 Punkte pro Spiel.
 */
export function calculatePoints(bet: BetInput, match: MatchResult): number {
  const actual = getTendency(match.homeScore, match.awayScore);
  let points = 0;

  // Teil 1: exaktes Ergebnis
  if (
    bet.homeScoreBet != null &&
    bet.awayScoreBet != null &&
    bet.homeScoreBet === match.homeScore &&
    bet.awayScoreBet === match.awayScore
  ) {
    points += 10;
  }

  // Teil 2: 1X2-Tendenz (unabhängig vom Ergebnis-Tipp)
  if (bet.outcomeBet && bet.outcomeBet === actual) {
    points += tendencyPoints(actual, match);
  }

  return points;
}
