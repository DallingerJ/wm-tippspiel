# ⚽ WM-Tippspiel 2026 (mit Außenseiter-Bonus)

Tippspiel zur Fußball-WM 2026 mit eigenen Accounts, Einladungslinks, echten
Turnierdaten und vollautomatischer K.o.-Runde. Next.js (App Router) ·
Prisma/SQLite · Tailwind CSS.

## Punktelogik (Ergebnis und 1X2 unabhängig)

Ergebnis-Tipp und 1X2-Tipp werden **getrennt** abgegeben und **addiert**:

| Tipp-Teil | Punkte |
| --- | --- |
| Exaktes Ergebnis | **+10** |
| 1X2 korrekt – Favoritensieg | **+3** |
| 1X2 korrekt – Unentschieden | **+4** |
| 1X2 korrekt – Außenseitersieg | **+6** |

Beide Teile sind optional → max. **16** Punkte pro Spiel (10 + 6). Der Favorit
steckt in `Match.favoriteTeamId` (Gruppenphase beim Seed, K.o. automatisch beim
Auflösen gesetzt); `null` = Toss-up, jeder Sieg zählt dann als Außenseiter (6 P).

## Features

- **Eigene Accounts** – E-Mail + Passwort (scrypt-Hash), HttpOnly-Session-Cookie.
- **Einladungslinks – nur Admin** – `/invite` erzeugt wiederverwendbare Links;
  neue Spieler registrieren sich unter `/join/<token>`.
- **Echte WM-2026-Daten** – 48 Teams, 12 Gruppen, alle 72 Gruppenspiele mit echten Terminen.
- **Vollautomatische K.o.-Runde** – Sechzehntel- bis Finale (32 Spiele). Der Admin
  trägt **nur Ergebnisse** ein; Tabellen, Paarungen, Favoriten und das
  Weiterschalten der Sieger passieren automatisch. Bei K.o.-Remis wählt der Admin
  nur den Sieger (Elfmeterschießen).

## Schnellstart

Die App nutzt **PostgreSQL** (z. B. gratis via [Neon](https://neon.tech)). Trage
die Connection-URL in `.env` als `DATABASE_URL` ein (siehe `.env.example`), dann:

```bash
npm install
npm run db:reset   # Schema + echte WM-Daten + K.o.-Bracket + Admin-Account
npm run dev        # http://localhost:3000
```

Nach `db:reset`/`db:seed` werden **Admin-Login** und **Start-Einladungslink** ausgegeben.

> **Hosting (gratis & dauerhaft):** komplette Anleitung in [`DEPLOY.md`](./DEPLOY.md)
> – Vercel + Neon, per GitHub-Login, ohne Kreditkarte.

### Standard-Admin

```
E-Mail:   admin@tippspiel.local
Passwort: admin1234
```

## Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Dev-Server |
| `npm test` | Unit-Tests der Punktelogik (Vitest) |
| `npm run db:seed` | Daten neu laden (gibt Admin + Invite-Link aus) |
| `npm run db:reset` | DB zurücksetzen + seeden |
| `npx prisma studio` | DB im Browser inspizieren |

## Ablauf

1. Als Admin einloggen (`/login`), unter `/invite` Link erzeugen und teilen.
2. Eingeladene registrieren sich → eigener Account, sofort im Spiel.
3. Tippen auf `/`: Ergebnis (zwei Felder) und/oder 1X2 (1 / X / 2) – unabhängig.
   K.o.-Spiele werden tippbar, sobald die Paarung feststeht.
4. Admin trägt unter `/admin` nur die Ergebnisse ein → Punkte, Rangliste und
   die komplette K.o.-Runde aktualisieren sich von selbst.

## Architektur

| Bereich | Datei(en) |
| --- | --- |
| DB-Schema | `prisma/schema.prisma` (User, Session, Invite, Team, Match, Bet) |
| Seed (echte Daten + Bracket) | `prisma/seed.ts` |
| Auth | `src/lib/auth.ts` |
| Punktelogik (rein) | `src/lib/scoring.ts` + `scoring.test.ts` |
| K.o.-Auflösung (rein + DB) | `src/lib/bracket.ts` |
| Abrechnung + Progression | `src/lib/settleMatch.ts` (Transaktion, idempotent) |
| API | `auth/{register,login,logout}`, `invites` (Admin), `bets`, `matches/[id]` (Admin) |
| UI | `MatchCard`, `Leaderboard`, `BettingBoard`, `InviteGenerator`, `AdminMatchRow` |

### Hinweise zur K.o.-Runde

- **Rundenstruktur und Termine sind echt** (R32 → Finale, 28.06.–19.07.2026).
- Die **K.o.-Paarungen** sind ein sauber verdrahtetes, vollständig
  automatisiertes **Template**: Gruppensieger/-zweite + die 8 besten Dritten
  werden nach Abschluss der Gruppenphase eingesetzt; Sieger schalten automatisch
  weiter. Die offizielle FIFA-Kombinationstabelle für die Dritt-Zuordnung wird
  bewusst vereinfacht (beste Dritte nach Rang). Wiring in `prisma/seed.ts` (`KNOCKOUT`).
- Gruppen-Tiebreaker (offizielle FIFA-Reihenfolge): Punkte → Tordifferenz →
  Tore → **direkter Vergleich** (Punkte → Tordifferenz → Tore aus den Duellen der
  punktgleichen Teams). Letzter Notnagel = Name (offiziell: Fair-Play/Los).
  Logik in `src/lib/bracket.ts`, getestet in `bracket.test.ts`.

> **Datenquellen:** Gruppen/Spielplan WM 2026 nach Wikipedia & ESPN (Stand Juni 2026).
> Team-`rating` ist eine grobe eigene Einschätzung (keine offiziellen Quoten),
> nur zur automatischen Favoritenbestimmung – in `prisma/seed.ts` anpassbar.
