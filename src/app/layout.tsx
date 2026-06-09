import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
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
        <SiteHeader
          user={user ? { name: user.name, role: user.role } : null}
        />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
