"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import type { TeamOption } from "@/components/TournamentPredictions";

interface Props {
  teams: TeamOption[];
  initialChampionTeamId: string | null;
  initialTopScorer: string | null;
}

export default function AdminTournament({
  teams,
  initialChampionTeamId,
  initialTopScorer,
}: Props) {
  const router = useRouter();
  const [champion, setChampion] = useState(initialChampionTeamId ?? "");
  const [scorer, setScorer] = useState(initialTopScorer ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/tournament", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championTeamId: champion || null,
          topScorerName: scorer.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-1 text-lg font-bold">🏆 Turnier-Ergebnisse</h2>
      <p className="mb-4 text-sm text-gray-500">
        WM-Sieger und Torschützenkönig eintragen – jeder passende Tipp gibt 15 Punkte
        (fließt automatisch in die Rangliste ein). Der Name muss genau dem entsprechen,
        was die Mitspieler tippen mussten.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            WM-Sieger
          </label>
          <select
            value={champion}
            onChange={(e) => setChampion(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">– noch offen –</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Torschützenkönig (Name)
          </label>
          <input
            type="text"
            value={scorer}
            onChange={(e) => setScorer(e.target.value)}
            placeholder="z. B. Kylian Mbappé"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:bg-gray-300"
        >
          {saving && <Spinner className="h-4 w-4 text-white" />}
          {saving ? "Speichert…" : "Speichern"}
        </button>
        {saved && <span className="text-sm text-green-600">✓ Gespeichert</span>}
      </div>
    </section>
  );
}
