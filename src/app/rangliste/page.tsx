import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Leaderboard from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function RanglistePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { points: "desc" },
    select: { id: true, name: true, points: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">🏆 Rangliste</h1>
      <p className="mb-6 text-sm text-gray-500">
        Gesamtpunkte aller Mitspieler – absteigend sortiert.
      </p>
      <Leaderboard users={users} highlightUserId={user.id} />
    </div>
  );
}
