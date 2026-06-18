import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roundName, sourceLabel } from "@/lib/bracket";
import { PREDICTION_DEADLINE, predictionsClosed } from "@/lib/predictions";
import BettingBoard, { BoardMatch } from "@/components/BettingBoard";
import TournamentPredictions from "@/components/TournamentPredictions";
import type { Outcome } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

const deadlineLabel = PREDICTION_DEADLINE.toLocaleString("de-DE", {
  timeZone: "Europe/Vienna",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}) + " Uhr";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [me, teams, matches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { championTeamId: true, topScorerBet: true },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        bets: { where: { userId: user.id } },
      },
    }),
  ]);

  const boardMatches: BoardMatch[] = matches.map((m) => {
    const myBet = m.bets[0];
    return {
      id: m.id,
      kickoff: m.kickoff.toISOString(),
      phase: m.group ? `Gruppe ${m.group}` : roundName(m.round),
      favoriteTeamId: m.favoriteTeamId,
      isFinished: m.isFinished,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeLabel: m.homeTeam ? null : sourceLabel(m.homeSource),
      awayLabel: m.awayTeam ? null : sourceLabel(m.awaySource),
      myBet: myBet
        ? {
            homeScoreBet: myBet.homeScoreBet,
            awayScoreBet: myBet.awayScoreBet,
            outcomeBet: (myBet.outcomeBet as Outcome | null) ?? null,
          }
        : null,
    };
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Spiele tippen</h1>
      <p className="mb-6 text-sm text-gray-500">
        Ergebnis und 1X2 zählen unabhängig: exaktes Ergebnis = 10 P · 1X2
        Favoritensieg = 3 P · Unentschieden = 4 P · Außenseitersieg = 6 P.
      </p>

      <TournamentPredictions
        teams={teams}
        initialChampionTeamId={me?.championTeamId ?? null}
        initialTopScorer={me?.topScorerBet ?? null}
        closed={predictionsClosed()}
        deadlineLabel={deadlineLabel}
      />

      <BettingBoard matches={boardMatches} />
    </div>
  );
}
