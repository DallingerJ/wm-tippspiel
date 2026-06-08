import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import InviteGenerator from "@/components/InviteGenerator";

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const invites = await prisma.invite.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Freunde einladen</h1>
      <p className="mb-6 text-sm text-gray-500">
        Teile einen Einladungslink – jeder Eingeladene legt seinen eigenen Account
        an und spielt mit. Links sind unbegrenzt nutzbar.
      </p>
      <InviteGenerator existingTokens={invites.map((i) => i.token)} />
    </div>
  );
}
