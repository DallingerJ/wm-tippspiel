"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";

export interface TeamOption {
  id: string;
  name: string;
}

interface Props {
  teams: TeamOption[];
  initialChampionTeamId: string | null;
  initialTopScorer: string | null;
  closed: boolean;
  deadlineLabel: string;
}

export default function TournamentPredictions({
  teams,
  initialChampionTeamId,
  initialTopScorer,
  closed,
  deadlineLabel,
}: Props) {
  const [champion, setChampion] = useState(initialChampionTeamId ?? "");
  const [scorer, setScorer] = useState(initialTopScorer ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const dirty =
    champion !== (initialChampionTeamId ?? "") ||
    scorer.trim() !== (initialTopScorer ?? "");

  const save = async () => {
    setSaving(true);
    setStatus("idle");
    setMsg(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championTeamId: champion || null,
          topScorerBet: scorer.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Speichern");
      }
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

  const championName =
    teams.find((t) => t.id === champion)?.name ?? "—";

  return (
    <section className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">🏆 Turnier-Tipps</h2>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
          je 15 Punkte
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        {closed ? (
          <>Auswahl geschlossen (seit {deadlineLabel}). Deine Tipps stehen fest.</>
        ) : (
          <>Wählbar bis <span className="font-semibold">{deadlineLabel}</span> – danach gesperrt.</>
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* WM-Sieger */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            WM-Sieger
          </label>
          {closed ? (
            <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800">
              {championName}
            </p>
          ) : (
            <select
              value={champion}
              onChange={(e) => setChampion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">– Team wählen –</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Torschützenkönig */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Torschützenkönig
          </label>
          {closed ? (
            <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800">
              {scorer || "—"}
            </p>
          ) : (
            <>
              <input
                type="text"
                value={scorer}
                onChange={(e) => setScorer(e.target.value)}
                placeholder="z. B. Kylian Mbappé"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="mt-1 text-xs text-amber-600">
                ⚠️ Namen exakt richtig schreiben (Vor- und Nachname) – bei Tippfehler
                gibt es keine Punkte.
              </p>
            </>
          )}
        </div>
      </div>

      {!closed && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving && <Spinner className="h-4 w-4 text-white" />}
            {saving ? "Speichern…" : status === "saved" && !dirty ? "✓ Gespeichert" : "Turnier-Tipp speichern"}
          </button>
          {status === "saved" && !dirty && (
            <span className="text-sm text-green-600">Gespeichert.</span>
          )}
          {status === "error" && (
            <span className="text-sm text-red-600">{msg ?? "Fehler"}</span>
          )}
        </div>
      )}
    </section>
  );
}
