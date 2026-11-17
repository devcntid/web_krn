/** Tipe bersama server ↔ klien untuk /admin/pengguna (tanpa kode server). */
export type UserRole = "super_admin" | "editor" | "penulis" | "kontributor" | "viewer";
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  totpEnabled: boolean;
  /** Peran ini wajib 2FA. */
  totpRequired: boolean;
  disabled: boolean;
  lastActiveAt: string | null;
  isSelf: boolean;
};
export type PendingInvite = { id: string; email: string; role: UserRole; expiresAt: string; expired: boolean; invitedBy: string | null };
export type AbilityRow = { key: string; label: string; roles: Record<UserRole, boolean> };
export type UsersResult = { ok: true; message: string; link?: string; emailed?: boolean } | { ok: false; error: string };
