import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UsersManager } from "@/components/admin/pengguna/UsersManager";
import { can, requireUser } from "@/server/permissions";
import { abilityMatrix, listPendingInvites, listUsers } from "@/server/users-service";

export const metadata: Metadata = { title: "Pengguna & Peran" };

/** /admin/pengguna (artboard "A10 · Pengguna & Peran"). Hanya Super Admin (`system.manage`). */
export default async function PenggunaPage() {
  const user = await requireUser();
  if (!can(user, "system.manage")) redirect("/admin/");
  const [users, invites] = await Promise.all([listUsers(user), listPendingInvites()]);
  return <UsersManager users={users} invites={invites} matrix={abilityMatrix()} />;
}
