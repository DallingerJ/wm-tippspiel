"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminMatchRowProps {
  id: string;
  phase: string;
  homeName: string;
  awayName: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  isKnockout: boolean;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinnerTeamId: string | null;
}

export default function AdminMatchRow({
  id,
  phase,
  homeName,
  awayName,
  homeTeamId,
  awayTeamId,
  isKnockout,
  isFinished,
  homeScore,
  awayScore,
  penaltyWinnerTeamId,
}: AdminMatchRowProps) {
  const router = useRouter();
  const [home, setHome] = useState(homeScore?.toString() ?? "");
  const [away, setAway] = useState(awayScore?.toString() ?? "");
  const [penWinner, setPenWinner] = useState<string | null>(penaltyWinnerTeamId);
  const [saving, setSaving] = useState(false);

  const tbd = !homeTeamId || !awayTeamId;
  const isDraw = home !== "" && away !== "" && Number(home) === Number(away);
  const needsPenalty = isKnockout && isDraw;
  const canSave =
    !saving && home !== "" && away !== "" && (!needsPenalty || penWinner != null);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: Number(home),
          awayScore: Number(away),
          penaltyWinnerTeamId: needsPenalty ? penWinner : null,
        }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (tbd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">
        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">{phase}</span>
        {homeName} <span>vs</span> {awayName}
        <span className="ml-auto text-xs">Teams stehen noch nicht fest</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex-1 text-sm font-medium">
          <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
            {phase}
          </span>
          {homeName} <span className="text-gray-400">vs</span> {awayName}
        </div>

        <input
          type="number"
          min={0}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="h-10 w-12 rounded-lg border border-gray-300 text-center font-bold focus:border-blue-500 focus:outline-none"
        />
        <span className="text-gray-400">:</span>
        <input
          type="number"
          min={0}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="h-10 w-12 rounded-lg border border-gray-300 text-center font-bold focus:border-blue-500 focus:outline-none"
        />

        <button
          onClick={save}
          disabled={!canSave}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:bg-gray-300"
        >
          {saving ? "…" : isFinished ? "Aktualisieren" : "Abrechnen"}
        </button>

        {isFinished && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">✓</span>
        )}
      </div>

      {needsPenalty && (
        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 text-sm">
          <span className="text-gray-500">Remis – wer kommt weiter?</span>
          <button
            onClick={() => setPenWinner(homeTeamId)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium ${
              penWinner === homeTeamId
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-600"
            }`}
          >
            {homeName}
          </button>
          <button
            onClick={() => setPenWinner(awayTeamId)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium ${
              penWinner === awayTeamId
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-600"
            }`}
          >
            {awayName}
          </button>
        </div>
      )}
    </div>
  );
}
