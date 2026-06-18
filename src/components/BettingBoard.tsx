"use client";

import { useEffect, useRef, useState } from "react";
import MatchCard, { Outcome, TeamView } from "@/components/MatchCard";

const TZ = "Europe/Vienna";

/** yyyy-mm-dd in Wiener Zeit (stabiler Schlüssel für Tag-Gruppierung & Scroll). */
function dayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // -> "2026-06-19"
}

export interface BoardMatch {
  id: string;
  kickoff: string;
  phase: string | null;
  favoriteTeamId: string | null;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: TeamView | null;
  awayTeam: TeamView | null;
  homeLabel: string | null;
  awayLabel: string | null;
  myBet: {
    homeScoreBet: number | null;
    awayScoreBet: number | null;
    outcomeBet: Outcome | null;
  } | null;
}

interface BettingBoardProps {
  matches: BoardMatch[];
}

interface DayGroup {
  key: string; // yyyy-mm-dd (Wien)
  label: string; // z.B. "Donnerstag, 19. Juni"
  matches: BoardMatch[];
}

/** Gruppiert Matches nach Kalendertag (Wiener Zeit) für eine übersichtliche Liste. */
function groupByDay(matches: BoardMatch[]): DayGroup[] {
  const buckets = new Map<string, DayGroup>();
  for (const m of matches) {
    const d = new Date(m.kickoff);
    const key = dayKey(d);
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: d.toLocaleDateString("de-DE", {
          timeZone: TZ,
          weekday: "long",
          day: "2-digit",
          month: "long",
        }),
        matches: [],
      });
    }
    buckets.get(key)!.matches.push(m);
  }
  return Array.from(buckets.values());
}

export default function BettingBoard({ matches }: BettingBoardProps) {
  const [days] = useState(() => groupByDay(matches));
  const containerRef = useRef<HTMLDivElement>(null);

  // Nach dem Laden automatisch zum heutigen (bzw. nächsten) Spieltag scrollen.
  useEffect(() => {
    const today = dayKey(new Date());
    // heutiger Tag, sonst der nächste anstehende, sonst der letzte
    const target =
      days.find((d) => d.key === today) ??
      days.find((d) => d.key >= today) ??
      days[days.length - 1];
    if (!target) return;
    const el = document.getElementById(`day-${target.key}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    // nur einmal beim Mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitBet = async (
    matchId: string,
    home: number | null,
    away: number | null,
    outcome: Outcome | null
  ) => {
    const res = await fetch("/api/bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        homeScoreBet: home,
        awayScoreBet: away,
        outcomeBet: outcome,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Fehler beim Speichern");
    }
  };

  return (
    <div ref={containerRef} className="space-y-8">
      {days.map((day) => (
        <div key={day.key} id={`day-${day.key}`} className="scroll-mt-24">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            {day.label}
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {day.matches.map((m) => (
              <MatchCard
                key={m.id}
                phase={m.phase}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeLabel={m.homeLabel}
                awayLabel={m.awayLabel}
                kickoff={m.kickoff}
                favoriteTeamId={m.favoriteTeamId}
                isFinished={m.isFinished}
                finalHomeScore={m.homeScore}
                finalAwayScore={m.awayScore}
                initialHomeBet={m.myBet?.homeScoreBet}
                initialAwayBet={m.myBet?.awayScoreBet}
                initialOutcome={m.myBet?.outcomeBet}
                onSubmit={(h, a, o) => submitBet(m.id, h, a, o)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
