import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RegisterForm from "@/components/RegisterForm";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await prisma.invite.findUnique({ where: { token: params.token } });

  const valid =
    invite &&
    (!invite.expiresAt || invite.expiresAt >= new Date()) &&
    (invite.maxUses == null || invite.uses < invite.maxUses);

  if (!valid) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="mb-3 text-2xl font-bold">Einladung ungültig</h1>
        <p className="text-gray-500">
          Dieser Einladungslink ist abgelaufen oder bereits aufgebraucht. Bitte
          frag den Ersteller nach einem neuen Link.
        </p>
        <Link href="/login" className="mt-6 inline-block text-blue-600 hover:underline">
          Zum Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-bold">Mitmachen 🎉</h1>
      <p className="mb-6 text-sm text-gray-500">
        Du wurdest zum WM-Tippspiel eingeladen. Erstelle deinen Account:
      </p>
      <RegisterForm token={params.token} />
      <p className="mt-4 text-center text-sm text-gray-500">
        Schon dabei?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
