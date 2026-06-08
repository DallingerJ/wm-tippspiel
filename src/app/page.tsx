import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roundName, sourceLabel } from "@/lib/bracket";
import BettingBoard, { BoardMatch } from "@/components/BettingBoard";
import type { Outcome } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matches = await prisma.match.findMany({
    orderBy: { kickoff: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      bets: { where: { userId: user.id } },
    },
  });

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
      <BettingBoard matches={boardMatches} />
    </div>
  );
}
