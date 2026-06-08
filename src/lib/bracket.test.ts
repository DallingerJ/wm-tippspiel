import { describe, it, expect } from "vitest";
import { computeGroupOrder } from "./bracket";

// 4 Team-Helfer (rating egal für die Tabelle)
const teams = [
  { id: "A", rating: 0, name: "A" },
  { id: "B", rating: 0, name: "B" },
  { id: "C", rating: 0, name: "C" },
  { id: "D", rating: 0, name: "D" },
];

const m = (home: string, away: string, hs: number, as: number) => ({
  homeTeamId: home,
  awayTeamId: away,
  homeScore: hs,
  awayScore: as,
  isFinished: true,
});

const order = (matches: ReturnType<typeof m>[]) =>
  computeGroupOrder(teams, matches).map((s) => s.teamId);

describe("Gruppentabelle – Gruppensieger automatisch korrekt", () => {
  it("sortiert nach Punkten", () => {
    // A 9, B 6, C 3, D 0
    const matches = [
      m("A", "B", 1, 0),
      m("A", "C", 1, 0),
      m("A", "D", 1, 0),
      m("B", "C", 1, 0),
      m("B", "D", 1, 0),
      m("C", "D", 1, 0),
    ];
    expect(order(matches)).toEqual(["A", "B", "C", "D"]);
  });

  it("bei Punktgleichheit entscheidet die TORDIFFERENZ", () => {
    // A und B je 7 Punkte; A hat +5, B hat +3 -> A ist Gruppensieger
    const matches = [
      m("A", "D", 3, 0), // A +3
      m("A", "B", 1, 1), // beide
      m("A", "C", 2, 0), // A +2  -> A: 7P, GD +5, GF 6
      m("B", "C", 1, 0), // B
      m("B", "D", 2, 0), // B     -> B: 7P, GD +3, GF 4
      m("C", "D", 2, 1), // C
    ];
    const result = order(matches);
    expect(result[0]).toBe("A"); // bessere Tordifferenz
    expect(result[1]).toBe("B");
  });

  it("bei gleicher Tordifferenz entscheiden die erzielten TORE", () => {
    // A und B je 7 Punkte, beide GD +4; A 6 Tore, B 5 Tore -> A vorn
    const matches = [
      m("A", "D", 3, 0),
      m("A", "C", 2, 1),
      m("A", "B", 1, 1), // A: 7P, GF 6, GA 2, GD +4
      m("B", "C", 2, 0),
      m("B", "D", 2, 0), // B: 7P, GF 5, GA 1, GD +4
      m("C", "D", 1, 0),
    ];
    const result = order(matches);
    expect(result[0]).toBe("A"); // mehr erzielte Tore bei gleicher GD
    expect(result[1]).toBe("B");
  });

  it("bei gleichen Punkten, Tordifferenz UND Toren entscheidet der DIREKTE VERGLEICH", () => {
    // A und B sind gesamt komplett gleich (6 P, +3, 4 Tore). B hat A direkt
    // geschlagen -> B steht vor A. Wichtig: alphabetisch käme A zuerst, der
    // direkte Vergleich kehrt das also bewusst um (kein Namens-Fallback).
    const matches = [
      m("B", "A", 1, 0), // direktes Duell: B schlägt A
      m("B", "C", 3, 0),
      m("B", "D", 0, 1),
      m("A", "C", 2, 0),
      m("A", "D", 2, 0),
      m("C", "D", 0, 1),
    ];
    // A: 6 P, +3, 4 Tore | B: 6 P, +3, 4 Tore | D: 6 P, 0 | C: 0 P
    const result = order(matches);
    expect(result[0]).toBe("B"); // direkter Vergleich gewonnen
    expect(result[1]).toBe("A");
    expect(result[2]).toBe("D");
  });

  it("liefert Sieger und Zweiten – genau das, was die Sechzehntelfinals füllt", () => {
    const matches = [
      m("A", "D", 2, 0),
      m("B", "C", 0, 0),
      m("A", "B", 0, 1), // B schlägt A
      m("C", "D", 1, 1),
      m("A", "C", 3, 0),
      m("B", "D", 2, 0),
    ];
    // B: 7P (S,U,S), A: 6P (S,N,S), C: 2P, D: 1P
    const result = computeGroupOrder(teams, matches);
    expect(result[0].teamId).toBe("B"); // -> Quelle "W-X"
    expect(result[1].teamId).toBe("A"); // -> Quelle "R-X"
  });
});
