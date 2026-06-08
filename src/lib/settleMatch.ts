import { prisma } from "@/lib/prisma";
import { calculatePoints, Tendency } from "@/lib/scoring";
import { resolveBracket } from "@/lib/bracket";

interface FinalResult {
  homeScore: number;
  awayScore: number;
  penaltyWinnerTeamId?: string | null; // nur K.o. bei Remis
}

/**
 * Schließt ein Match ab: Ergebnis speichern, Tipps bewerten, User-Punkte neu
 * aggregieren UND das K.o.-Bracket automatisch weiterschalten.
 * Idempotent (re-aggregiert aus allen Bets, füllt nur offene K.o.-Plätze).
 */
export async function settleMatch(matchId: string, result: FinalResult) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { bets: true },
    });

    await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        isFinished: true,
        penaltyWinnerTeamId: result.penaltyWinnerTeamId ?? null,
      },
    });

    // Tipps dieses Spiels bewerten (Teams stehen bei beendeten Spielen fest)
    const matchResult = {
      homeTeamId: match.homeTeamId ?? "",
      awayTeamId: match.awayTeamId ?? "",
      favoriteTeamId: match.favoriteTeamId,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
    };

    const affectedUserIds = new Set<string>();
    for (const bet of match.bets) {
      const points = calculatePoints(
        {
          homeScoreBet: bet.homeScoreBet,
          awayScoreBet: bet.awayScoreBet,
          outcomeBet: (bet.outcomeBet as Tendency | null) ?? null,
        },
        matchResult
      );
      await tx.bet.update({ where: { id: bet.id }, data: { points } });
      affectedUserIds.add(bet.userId);
    }

    for (const userId of affectedUserIds) {
      const agg = await tx.bet.aggregate({
        where: { userId },
        _sum: { points: true },
      });
      await tx.user.update({
        where: { id: userId },
        data: { points: agg._sum.points ?? 0 },
      });
    }

    // K.o.-Bracket automatisch auflösen (Sieger weiterschalten, Favoriten setzen)
    await resolveBracket(tx);

    return match.bets.length;
  });
}
