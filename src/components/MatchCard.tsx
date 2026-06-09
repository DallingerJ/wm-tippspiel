"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";

export type Outcome = "HOME" | "DRAW" | "AWAY";

export interface TeamView {
  id: string;
  name: string;
  flagUrl?: string | null;
}

interface MatchCardProps {
  homeTeam: TeamView | null;
  awayTeam: TeamView | null;
  homeLabel?: string | null; // Platzhalter, solange Team offen (K.o.)
  awayLabel?: string | null;
  kickoff: Date | string;
  favoriteTeamId: string | null;
  phase?: string | null; // z.B. "Gruppe A" oder "Achtelfinale"
  initialHomeBet?: number | null;
  initialAwayBet?: number | null;
  initialOutcome?: Outcome | null;
  finalHomeScore?: number | null;
  finalAwayScore?: number | null;
  isFinished?: boolean;
  onSubmit?: (
    home: number | null,
    away: number | null,
    outcome: Outcome | null
  ) => Promise<void> | void;
}

type Role = "favorite" | "underdog" | "neutral";

function TeamSide({
  team,
  label,
  role,
}: {
  team: TeamView | null;
  label?: string | null;
  role: Role;
}) {
  const badge =
    role === "favorite"
      ? { label: "Favorit", points: "+3", cls: "bg-blue-100 text-blue-700" }
      : role === "underdog"
      ? { label: "Außenseiter", points: "+6", cls: "bg-amber-100 text-amber-700" }
      : { label: "Toss-up", points: "+6", cls: "bg-gray-100 text-gray-500" };

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      {team?.flagUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.flagUrl}
          alt={team.name}
          className="h-9 w-12 rounded object-cover shadow-sm sm:h-10 sm:w-14"
        />
      ) : (
        <div className="flex h-9 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400 sm:h-10 sm:w-14">
          {team ? team.name.slice(0, 3).toUpperCase() : "?"}
        </div>
      )}
      <span className="text-center text-[13px] font-semibold leading-tight text-gray-800 sm:text-sm">
        {team ? team.name : <span className="italic text-gray-400">{label ?? "offen"}</span>}
      </span>
      {team && (
        <span
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${badge.cls}`}
        >
          {badge.label}
          <span className="font-bold opacity-80">{badge.points} P</span>
        </span>
      )}
    </div>
  );
}

export default function MatchCard({
  homeTeam,
  awayTeam,
  homeLabel,
  awayLabel,
  kickoff,
  favoriteTeamId,
  phase,
  initialHomeBet,
  initialAwayBet,
  initialOutcome,
  finalHomeScore,
  finalAwayScore,
  isFinished = false,
  onSubmit,
}: MatchCardProps) {
  const [home, setHome] = useState(initialHomeBet?.toString() ?? "");
  const [away, setAway] = useState(initialAwayBet?.toString() ?? "");
  const [outcome, setOutcome] = useState<Outcome | null>(initialOutcome ?? null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const tbd = !homeTeam || !awayTeam;
  const kickoffDate = new Date(kickoff);
  const closed = isFinished || kickoffDate <= new Date();
  const locked = tbd || closed;

  const roleFor = (teamId: string): Role => {
    if (!favoriteTeamId) return "neutral";
    return teamId === favoriteTeamId ? "favorite" : "underdog";
  };

  const scoreFilled = home !== "" && away !== "";
  const scoreHalf = (home !== "") !== (away !== "");
  const canSubmit = !locked && !saving && (scoreFilled || outcome != null) && !scoreHalf;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setStatus("idle");
    setMsg(null);
    try {
      await onSubmit?.(
        scoreFilled ? Number(home) : null,
        scoreFilled ? Number(away) : null,
        outcome
      );
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

  const outcomeBtn = (value: Outcome, label: string) => {
    const active = outcome === value;
    return (
      <button
        type="button"
        disabled={locked}
        onClick={() => setOutcome(active ? null : value)}
        className={`flex-1 rounded-lg border py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
          active
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-gray-300 bg-white text-gray-600 hover:border-blue-400"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="mb-4 flex items-center justify-center gap-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
        {phase && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {phase}
          </span>
        )}
        <span>
          {kickoffDate.toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          Uhr
        </span>
        {isFinished && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-700">
            Beendet
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <TeamSide team={homeTeam} label={homeLabel} role={homeTeam ? roleFor(homeTeam.id) : "neutral"} />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={home}
            disabled={locked}
            onChange={(e) => setHome(e.target.value)}
            className="h-11 w-11 rounded-lg border border-gray-300 text-center text-lg font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 sm:h-12 sm:w-12"
          />
          <span className="text-gray-400">:</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={away}
            disabled={locked}
            onChange={(e) => setAway(e.target.value)}
            className="h-11 w-11 rounded-lg border border-gray-300 text-center text-lg font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 sm:h-12 sm:w-12"
          />
        </div>

        <TeamSide team={awayTeam} label={awayLabel} role={awayTeam ? roleFor(awayTeam.id) : "neutral"} />
      </div>

      {isFinished && finalHomeScore != null && finalAwayScore != null && (
        <p className="mt-3 text-center text-sm text-gray-500">
          Endstand:{" "}
          <span className="font-semibold text-gray-700">
            {finalHomeScore} : {finalAwayScore}
          </span>
        </p>
      )}

      {tbd && !isFinished && (
        <p className="mt-4 text-center text-xs text-gray-400">
          Teams stehen noch nicht fest – tippbar, sobald die Paarung feststeht.
        </p>
      )}

      {!locked && (
        <>
          <div className="mt-4">
            <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400">
              1X2-Tipp (separat gewertet)
            </p>
            <div className="flex gap-2">
              {outcomeBtn("HOME", "1")}
              {outcomeBtn("DRAW", "X")}
              {outcomeBtn("AWAY", "2")}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving && <Spinner className="h-4 w-4 text-white" />}
            {saving
              ? "Speichern…"
              : status === "saved"
              ? "✓ Gespeichert – ändern?"
              : "Tipp speichern"}
          </button>

          {scoreHalf && (
            <p className="mt-2 text-center text-xs text-amber-600">
              Bitte beide Ergebnis-Felder ausfüllen (oder beide leer lassen).
            </p>
          )}
          {status === "error" && (
            <p className="mt-2 text-center text-xs text-red-600">{msg ?? "Fehler"}</p>
          )}
        </>
      )}
    </div>
  );
}
