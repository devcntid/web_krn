import "server-only";

import { redirect } from "next/navigation";

import { auth } from "./auth";
import { type Ability, type Role, can } from "./roles";

export { ROLE_ABILITIES, TOTP_REQUIRED_ROLES, can, requiresTotp } from "./roles";
export type { Ability, Role } from "./roles";

export type AuthUser = { id: string; role: Role; email: string; name: string | null };

/**
 * Pengguna yang sudah masuk penuh (termasuk 2FA bila wajib). Data peran & status
 * nonaktif dibaca ulang dari database oleh callback `jwt` di setiap pemanggilan.
 * Untuk halaman: redirect ke login. Untuk route handler, tangani null sendiri via `getCurrentUser()`.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.role || !u.mfaPassed) return null;
  return { id: u.id, role: u.role, email: u.email ?? "", name: u.name ?? null };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login/");
  return user;
}

/** Dilempar saat pengguna masuk tetapi perannya tidak punya kemampuan yang diminta. */
export class ForbiddenError extends Error {
  constructor(public readonly ability: Ability) {
    super("Akses ditolak.");
    this.name = "ForbiddenError";
  }
}

export async function requireAbility(ability: Ability): Promise<AuthUser> {
  const user = await requireUser();
  if (!can(user, ability)) throw new ForbiddenError(ability);
  return user;
}
