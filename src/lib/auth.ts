import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const COOKIE = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 Tage

/** Erzeugt "salt:hash" mit scrypt (kein externer Crypto-Dependency nötig). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Verifiziert ein Passwort zeitkonstant gegen den gespeicherten Hash. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Legt eine Session an und setzt das HttpOnly-Cookie (nur in Route Handlers/Server Actions). */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { token, userId, expiresAt } });

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Beendet die aktuelle Session und löscht das Cookie. */
export async function destroySession(): Promise<void> {
  const token = cookies().get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  cookies().delete(COOKIE);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
};

/** Liest den eingeloggten User aus dem Cookie (auch in Server Components nutzbar). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  const { id, name, email, role, points } = session.user;
  return { id, name, email, role, points };
}
