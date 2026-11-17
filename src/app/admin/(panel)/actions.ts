"use server";

import { auth, signOut } from "@/server/auth";
import { logActivity } from "@/server/activity";

export async function logout() {
  const user = (await auth())?.user;
  if (user?.id) await logActivity({ userId: user.id, action: "logout", entity: "user", entityId: user.id, summary: "Keluar dari admin" });
  await signOut({ redirectTo: "/admin/login/" });
}
