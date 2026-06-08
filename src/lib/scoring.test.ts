import { describe, it, expect } from "vitest";
import { calculatePoints, getTendency, MatchResult } from "./scoring";

// Favorit = HOME ("fav"), Außenseiter = AWAY ("dog")
const match = (
  homeScore: number,
  awayScore: number,
  favoriteTeamId: string | null = "fav"
): MatchResult => ({
  homeTeamId: "fav",
  awayTeamId: "dog",
  homeScore,
  awayScore,
  favoriteTeamId,
});

describe("getTendency", () => {
  it("erkennt Heimsieg, Unentschieden und Auswärtssieg", () => {
    expect(getTendency(2, 1)).toBe("HOME");
    expect(getTendency(1, 1)).toBe("DRAW");
    expect(getTendency(0, 2)).toBe("AWAY");
  });
});

describe("calculatePoints – Ergebnis und 1X2 unabhängig", () => {
  it("nur Ergebnis exakt (ohne 1X2-Tipp) = 10", () => {
    expect(calculatePoints({ homeScoreBet: 2, awayScoreBet: 1 }, match(2, 1))).toBe(10);
  });

  it("nur 1X2 korrekt, Favoritensieg = 3", () => {
    expect(calculatePoints({ outcomeBet: "HOME" }, match(3, 1))).toBe(3);
  });

  it("nur 1X2 korrekt, Unentschieden = 4", () => {
    expect(calculatePoints({ outcomeBet: "DRAW" }, match(2, 2))).toBe(4);
  });

  it("nur 1X2 korrekt, Außenseitersieg = 6", () => {
    expect(calculatePoints({ outcomeBet: "AWAY" }, match(0, 2))).toBe(6);
  });

  it("Ergebnis exakt UND 1X2 korrekt werden addiert: 10 + 3 = 13", () => {
    expect(
      calculatePoints({ homeScoreBet: 2, awayScoreBet: 1, outcomeBet: "HOME" }, match(2, 1))
    ).toBe(13);
  });

  it("exaktes Remis + Remis-Tendenz = 10 + 4 = 14", () => {
    expect(
      calculatePoints({ homeScoreBet: 2, awayScoreBet: 2, outcomeBet: "DRAW" }, match(2, 2))
    ).toBe(14);
  });

  it("Ergebnis falsch, aber 1X2 (Außenseiter) korrekt = 6", () => {
    expect(
      calculatePoints({ homeScoreBet: 1, awayScoreBet: 3, outcomeBet: "AWAY" }, match(0, 2))
    ).toBe(6);
  });

  it("falsche Tendenz und falsches Ergebnis = 0", () => {
    expect(
      calculatePoints({ homeScoreBet: 2, awayScoreBet: 0, outcomeBet: "HOME" }, match(0, 1))
    ).toBe(0);
  });

  it("Toss-up (favoriteTeamId null): jeder Sieg zählt als Außenseiter = 6", () => {
    expect(calculatePoints({ outcomeBet: "HOME" }, match(2, 1, null))).toBe(6);
  });

  it("kein Tipp abgegeben = 0", () => {
    expect(calculatePoints({}, match(1, 0))).toBe(0);
  });
});
