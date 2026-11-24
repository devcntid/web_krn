"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAbility } from "@/server/permissions";
import * as svc from "@/server/users-service";
import type { UsersResult } from "@/types/admin-users";

async function act(fn: (admin: Awaited<ReturnType<typeof requireAbility>>) => Promise<UsersResult>): Promise<UsersResult> {
  const admin = await requireAbility("system.manage");
  const result = await fn(admin);
  if (result.ok) revalidatePath("/admin/pengguna");
  return result;
}

/** Asal URL untuk tautan undangan = domain admin yang sedang dipakai (produksi/preview/lokal). */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const inviteUserAction = async (email: string, role: string) => act(async (a) => svc.inviteUser(a, String(email), role, await origin()));
export const revokeInviteAction = async (id: string) => act((a) => svc.revokeInvite(a, String(id)));
export const changeRoleAction = async (id: string, role: string) => act((a) => svc.changeRole(a, String(id), role));
export const setDisabledAction = async (id: string, disabled: boolean) => act((a) => svc.setDisabled(a, String(id), disabled === true));
export const resetTotpAction = async (id: string) => act((a) => svc.resetTotp(a, String(id)));
export const deleteUserAction = async (id: string) => act((a) => svc.deleteUser(a, String(id)));
export const updateUserAction = async (id: string, input: { name: string; email: string; newPassword: string; confirmPassword: string }) =>
  act((a) =>
    svc.updateOtherUser(a, String(id), {
      name: String(input?.name ?? ""),
      email: String(input?.email ?? ""),
      newPassword: String(input?.newPassword ?? ""),
      confirmPassword: String(input?.confirmPassword ?? ""),
    }),
  );
