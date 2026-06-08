# 🚀 Deployment: Vercel + Neon (gratis & dauerhaft)

Die App ist deploy-fertig auf **Postgres** umgestellt. Drei Schritte: Datenbank
(Neon) anlegen, Daten einspielen, auf Vercel deployen. Beides per GitHub-Login,
ohne Kreditkarte.

---

## 1) Datenbank bei Neon anlegen (2 Min.)

1. Auf <https://neon.tech> mit GitHub einloggen → **Create project** (Region egal,
   z. B. Frankfurt).
2. Im Dashboard unter **Connection string** zwei Strings kopieren:
   - **Pooled connection** (Host enthält `-pooler`) → für Vercel
   - **Direct connection** (ohne `-pooler`) → für das lokale Einspielen
   Beide sehen so aus: `postgresql://user:pass@ep-...neon.tech/neondb?sslmode=require`

---

## 2) Schema + Startdaten einspielen (lokal, einmalig)

Trage die **Direct**-Connection in `.env` als `DATABASE_URL` ein, dann:

```bash
npx prisma db push      # erstellt alle Tabellen in Neon
npm run db:seed         # 48 Teams, 104 Spiele, Admin-Account, Einladungslink
```

Die Konsole zeigt am Ende **Admin-Login** und den **Start-Einladungslink** –
notieren!

> Tipp: In diesem Chat kannst du Befehle mit vorangestelltem `!` direkt ausführen,
> z. B. `! npx prisma db push`.

---

## 3) Auf Vercel deployen

### Variante A – Vercel CLI (am schnellsten)

```bash
npm i -g vercel
vercel login            # interaktiv (GitHub) – in diesem Chat: ! vercel login
vercel link             # neues Projekt anlegen/verknüpfen
```

Dann die **Pooled**-Connection als Environment-Variable setzen (für alle Stages):

```bash
vercel env add DATABASE_URL production
# Wert = Neon POOLED connection string einfügen
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

Und live schalten:

```bash
vercel --prod
```

Vercel gibt dir eine URL wie `https://wm-tippspiel-xyz.vercel.app`.

### Variante B – GitHub + Vercel-Dashboard

1. Repo zu GitHub pushen (siehe unten).
2. Auf <https://vercel.com> mit GitHub einloggen → **Add New… → Project** →
   Repo importieren.
3. Unter **Environment Variables** `DATABASE_URL` = Neon **Pooled** string setzen.
4. **Deploy**.

```bash
# Repo initialisieren und pushen (einmalig)
git init
git add .
git commit -m "WM-Tippspiel"
git branch -M main
git remote add origin https://github.com/<dein-user>/wm-tippspiel.git
git push -u origin main
```

---

## 4) Loslegen

1. `https://<deine-vercel-url>/login` → Admin-Login (`admin@tippspiel.local` /
   `admin1234`). **Passwort danach ändern** (oder im Seed anpassen).
2. `/invite` → Einladungslink erstellen und an die Mitspieler schicken.
3. Mitspieler registrieren sich über den Link, tippen, fertig.
4. Ergebnisse trägst du unter `/admin` ein – K.o.-Runde & Rangliste laufen automatisch.

---

## Wichtig / Troubleshooting

- **Pooled vs. Direct:** Vercel-Runtime braucht die **Pooled**-Connection
  (serverlose Functions). `prisma db push`/`seed` brauchen die **Direct**-Connection.
- **Daten bleiben erhalten** – Neon ist eine echte, dauerhafte Datenbank (Vercel
  selbst hat kein persistentes Dateisystem, deshalb der Umzug weg von SQLite).
- **Schema geändert?** Lokal `prisma db push` gegen die Direct-Connection erneut
  ausführen. Vercel braucht keinen DB-Schritt im Build.
- **Build-Variable:** `DATABASE_URL` muss in Vercel gesetzt sein, sonst schlägt
  `prisma generate` im Build fehl.
- Free-Tier-Grenzen (locker für ein Tippspiel): Neon ~0,5 GB Storage, Vercel
  Hobby 100 GB Bandbreite/Monat.
