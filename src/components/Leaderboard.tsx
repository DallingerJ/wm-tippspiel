interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  highlightUserId?: string | null;
}

export default function Leaderboard({ users, highlightUserId }: LeaderboardProps) {
  // Defensiv absteigend sortieren (unabhängig von der Query-Reihenfolge)
  const ranked = [...users].sort((a, b) => b.points - a.points);

  const medal = (rank: number) =>
    rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-5 py-3 font-medium">#</th>
            <th className="px-5 py-3 font-medium">Spieler</th>
            <th className="px-5 py-3 text-right font-medium">Punkte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ranked.map((user, i) => (
            <tr
              key={user.id}
              className={
                user.id === highlightUserId
                  ? "bg-blue-50"
                  : i < 3
                  ? "bg-amber-50/40"
                  : undefined
              }
            >
              <td className="px-5 py-3 font-semibold text-gray-700">
                {medal(i) ?? i + 1}
              </td>
              <td className="px-5 py-3 text-gray-800">{user.name}</td>
              <td className="px-5 py-3 text-right text-lg font-bold tabular-nums text-blue-700">
                {user.points}
              </td>
            </tr>
          ))}

          {ranked.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                Noch keine Punkte vergeben.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
