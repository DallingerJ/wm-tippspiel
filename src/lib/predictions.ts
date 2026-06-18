/**
 * Turnier-Tipps: WM-Sieger (Dropdown) und Torschützenkönig (Freitext).
 * Beide je +15 Punkte. Auswahl nur bis zur Deadline möglich.
 */

export const CHAMPION_POINTS = 15;
export const TOP_SCORER_POINTS = 15;

// Deadline: 19.06.2026, 19:00 Uhr Wien (CEST = UTC+2) -> fester Zeitpunkt.
export const PREDICTION_DEADLINE = new Date("2026-06-19T19:00:00+02:00");

/** Sind die Turnier-Tipps bereits geschlossen? (Server-Zeit ist maßgeblich.) */
export function predictionsClosed(now: Date = new Date()): boolean {
  return now.getTime() >= PREDICTION_DEADLINE.getTime();
}

/** Namens-Normalisierung für den Torschützenkönig-Vergleich (tolerant ggü. Groß/Klein & Leerzeichen). */
export function normalizeScorer(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** +15, wenn der getippte WM-Sieger dem tatsächlichen entspricht. */
export function championBonus(
  pick: string | null | undefined,
  actual: string | null | undefined
): number {
  if (!pick || !actual) return 0;
  return pick === actual ? CHAMPION_POINTS : 0;
}

/** +15, wenn der getippte Torschützenkönig (Name) passt. */
export function topScorerBonus(
  pick: string | null | undefined,
  actual: string | null | undefined
): number {
  if (!pick || !actual) return 0;
  return normalizeScorer(pick) === normalizeScorer(actual) ? TOP_SCORER_POINTS : 0;
}
