"use client";

import { useState } from "react";
import MatchCard, { Outcome, TeamView } from "@/components/MatchCard";

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

/** Gruppiert Matches nach Kalendertag für eine übersichtliche Liste. */
function groupByDay(matches: BoardMatch[]): [string, BoardMatch[]][] {
  const buckets = new Map<string, BoardMatch[]>();
  for (const m of matches) {
    const day = new Date(m.kickoff).toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day)!.push(m);
  }
  return Array.from(buckets.entries());
}

export default function BettingBoard({ matches }: BettingBoardProps) {
  const [days] = useState(() => groupByDay(matches));

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
    <div className="space-y-8">
      {days.map(([day, dayMatches]) => (
        <div key={day}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            {day}
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {dayMatches.map((m) => (
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
