"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

export default function RegisterForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Registrierung fehlgeschlagen");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-600">Anzeigename</label>
        <input
          type="text"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-600">E-Mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-600">
          Passwort <span className="text-gray-400">(min. 8 Zeichen)</span>
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        {loading && <Spinner className="h-4 w-4 text-white" />}
        {loading ? "Account wird erstellt…" : "Account erstellen & mitspielen"}
      </button>
    </form>
  );
}
