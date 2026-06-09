"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";

interface InviteGeneratorProps {
  existingTokens: string[];
}

export default function InviteGenerator({ existingTokens }: InviteGeneratorProps) {
  const [links, setLinks] = useState<string[]>(() =>
    existingTokens.map((t) => `${origin()}/join/${t}`)
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function origin() {
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  const create = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) setLinks((prev) => [`${origin()}/join/${data.token}`, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(link);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <button
        onClick={create}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        {loading && <Spinner className="h-4 w-4 text-white" />}
        {loading ? "Erstelle…" : "+ Neuen Einladungslink erstellen"}
      </button>

      <ul className="mt-5 space-y-2">
        {links.map((link) => (
          <li
            key={link}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <code className="flex-1 truncate text-sm text-gray-700">{link}</code>
            <button
              onClick={() => copy(link)}
              className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              {copied === link ? "✓ Kopiert" : "Kopieren"}
            </button>
          </li>
        ))}
        {links.length === 0 && (
          <li className="text-sm text-gray-400">Noch keine Einladungslinks erstellt.</li>
        )}
      </ul>
    </div>
  );
}
