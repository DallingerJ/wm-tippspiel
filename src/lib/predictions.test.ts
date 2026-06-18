import { describe, it, expect } from "vitest";
import {
  championBonus,
  topScorerBonus,
  normalizeScorer,
  predictionsClosed,
  PREDICTION_DEADLINE,
  CHAMPION_POINTS,
  TOP_SCORER_POINTS,
} from "./predictions";

describe("championBonus", () => {
  it("gibt 15 bei richtigem WM-Sieger", () => {
    expect(championBonus("team-fr", "team-fr")).toBe(CHAMPION_POINTS);
  });
  it("gibt 0 bei falschem Tipp", () => {
    expect(championBonus("team-de", "team-fr")).toBe(0);
  });
  it("gibt 0 wenn kein Tipp oder kein Ergebnis", () => {
    expect(championBonus(null, "team-fr")).toBe(0);
    expect(championBonus("team-fr", null)).toBe(0);
  });
});

describe("topScorerBonus", () => {
  it("gibt 15 bei exaktem Namen", () => {
    expect(topScorerBonus("Kylian Mbappé", "Kylian Mbappé")).toBe(TOP_SCORER_POINTS);
  });
  it("ist tolerant ggü. Groß/Klein & Mehrfach-Leerzeichen", () => {
    expect(topScorerBonus("  kylian   mbappé ", "Kylian Mbappé")).toBe(TOP_SCORER_POINTS);
  });
  it("gibt 0 bei Tippfehler im Namen", () => {
    expect(topScorerBonus("Kilian Mbappe", "Kylian Mbappé")).toBe(0);
  });
});

describe("normalizeScorer", () => {
  it("trimmt, kleinschreibt und kollabiert Leerzeichen", () => {
    expect(normalizeScorer("  Harry   Kane ")).toBe("harry kane");
  });
});

describe("predictionsClosed", () => {
  it("offen vor der Deadline", () => {
    expect(predictionsClosed(new Date(PREDICTION_DEADLINE.getTime() - 1000))).toBe(false);
  });
  it("geschlossen ab der Deadline", () => {
    expect(predictionsClosed(new Date(PREDICTION_DEADLINE.getTime()))).toBe(true);
    expect(predictionsClosed(new Date(PREDICTION_DEADLINE.getTime() + 1000))).toBe(true);
  });
  it("Deadline ist 19.06.2026 19:00 Wien (= 17:00 UTC)", () => {
    expect(PREDICTION_DEADLINE.toISOString()).toBe("2026-06-19T17:00:00.000Z");
  });
});
