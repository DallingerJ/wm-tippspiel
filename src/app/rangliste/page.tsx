import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { championBonus, topScorerBonus } from "@/lib/predictions";
import Leaderboard from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function RanglistePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [rows, tournament] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      select: {
        id: true,
        name: true,
        points: true,
        championTeamId: true,
        topScorerBet: true,
      },
    }),
    prisma.tournament.findUnique({ where: { id: "singleton" } }),
  ]);

  // Turnier-Boni (WM-Sieger / Torschützenkönig, je 15 P) live dazurechnen.
  const users = rows
    .map((u) => {
      const bonus =
        championBonus(u.championTeamId, tournament?.championTeamId) +
        topScorerBonus(u.topScorerBet, tournament?.topScorerName);
      return { id: u.id, name: u.name, points: u.points + bonus, bonus };
    })
    .sort((a, b) => b.points - a.points);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">🏆 Rangliste</h1>
      <p className="mb-6 text-sm text-gray-500">
        Gesamtpunkte aller Mitspieler – inkl. Turnier-Tipps (WM-Sieger &
        Torschützenkönig, je 15 P) – absteigend sortiert.
      </p>
      <Leaderboard users={users} highlightUserId={user.id} />
    </div>
  );
}
