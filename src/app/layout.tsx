import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "WM-Tippspiel 2026",
  description: "Tippspiel zur Fußball-WM 2026 mit Außenseiter-Bonus",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="de">
      <body className="min-h-screen text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ⚽ WM-Tippspiel 2026
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-gray-600">
              {user ? (
                <>
                  <Link href="/" className="hover:text-blue-600">Tippen</Link>
                  <Link href="/rangliste" className="hover:text-blue-600">Rangliste</Link>
                  {user.role === "ADMIN" && (
                    <>
                      <Link href="/invite" className="hover:text-blue-600">Einladen</Link>
                      <Link href="/admin" className="hover:text-blue-600">Admin</Link>
                    </>
                  )}
                  <span className="hidden text-gray-400 sm:inline">·</span>
                  <span className="hidden text-gray-700 sm:inline">{user.name}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="hover:text-blue-600">Anmelden</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
