"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SiteHeaderProps {
  user: { name: string; role: string } | null;
}

export default function SiteHeader({ user }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const links: { href: string; label: string }[] = user
    ? [
        { href: "/", label: "Tippen" },
        { href: "/rangliste", label: "Rangliste" },
        ...(user.role === "ADMIN"
          ? [
              { href: "/invite", label: "Einladen" },
              { href: "/admin", label: "Admin" },
            ]
          : []),
      ]
    : [{ href: "/login", label: "Anmelden" }];

  const linkCls = (href: string) =>
    `transition hover:text-blue-600 ${
      pathname === href ? "text-blue-600" : "text-gray-600"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 whitespace-nowrap text-base font-bold tracking-tight sm:text-lg"
        >
          <span aria-hidden>⚽</span>
          <span>
            WM-Tippspiel <span className="text-blue-600">2026</span>
          </span>
        </Link>

        {/* Desktop-Nav */}
        <nav className="hidden items-center gap-5 text-sm font-medium sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
          {user && (
            <>
              <span className="text-gray-300">·</span>
              <span className="max-w-[10rem] truncate text-gray-700">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="font-medium text-gray-500 transition hover:text-red-600"
              >
                Abmelden
              </button>
            </>
          )}
        </nav>

        {/* Mobile-Burger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menü"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 sm:hidden"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile-Menü (ausklappbar) */}
      {open && (
        <nav className="border-t border-gray-100 bg-white px-4 py-2 sm:hidden">
          {user && (
            <p className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Angemeldet als {user.name}
            </p>
          )}
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-2 py-2.5 text-sm font-medium ${
                pathname === l.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={logout}
              className="block w-full rounded-lg px-2 py-2.5 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-red-600"
            >
              Abmelden
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
