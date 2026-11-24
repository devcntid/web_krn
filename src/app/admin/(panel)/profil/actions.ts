"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/server/permissions";
import { updateOwnProfile } from "@/server/users-service";
import type { UsersResult } from "@/types/admin-users";

export async function updateProfileAction(input: { name: string; currentPassword: string; newPassword: string; confirmPassword: string }): Promise<UsersResult> {
  const user = await requireUser();
  const result = await updateOwnProfile(user, {
    name: String(input.name ?? ""),
    currentPassword: String(input.currentPassword ?? ""),
    newPassword: String(input.newPassword ?? ""),
    confirmPassword: String(input.confirmPassword ?? ""),
  });
  if (result.ok) revalidatePath("/admin/profil");
  return result;
}
