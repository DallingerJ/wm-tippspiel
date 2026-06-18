import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roundName, sourceLabel } from "@/lib/bracket";
import AdminMatchRow from "@/components/AdminMatchRow";
import AdminTournament from "@/components/AdminTournament";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [teams, tournament, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tournament.findUnique({ where: { id: "singleton" } }),
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Admin · Ergebnisse</h1>
      <p className="mb-6 text-sm text-gray-500">
        Nur Ergebnisse eintragen – Tipp-Abrechnung, Rangliste und die K.o.-Paarungen
        (inkl. Favorit) werden automatisch aktualisiert. Bei K.o.-Remis den Sieger wählen.
      </p>

      <AdminTournament
        teams={teams}
        initialChampionTeamId={tournament?.championTeamId ?? null}
        initialTopScorer={tournament?.topScorerName ?? null}
      />

      <div className="space-y-2">
        {matches.map((m) => (
          <AdminMatchRow
            key={m.id}
            id={m.id}
            phase={m.group ? `Gruppe ${m.group}` : roundName(m.round)}
            homeName={m.homeTeam?.name ?? sourceLabel(m.homeSource)}
            awayName={m.awayTeam?.name ?? sourceLabel(m.awaySource)}
            homeTeamId={m.homeTeamId}
            awayTeamId={m.awayTeamId}
            isKnockout={m.round !== "GROUP"}
            isFinished={m.isFinished}
            homeScore={m.homeScore}
            awayScore={m.awayScore}
            penaltyWinnerTeamId={m.penaltyWinnerTeamId}
          />
        ))}
      </div>
    </div>
  );
}
