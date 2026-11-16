import "server-only";

/* Matriks peran murni (tanpa dependensi Next/Auth.js) — diekspor ulang oleh permissions.ts. */

/** Peran pengguna (sama dengan enum `user_role` di database). */
export type Role = "super_admin" | "editor" | "penulis" | "kontributor" | "viewer";

/** Kemampuan — baris tabel "Peran & hak akses" di docs/BUILD_PLAYBOOK.md. */
export type Ability =
  | "draft.write" // Menulis draf
  | "content.publish" // Menerbitkan
  | "content.review" // Meninjau & menyetujui
  | "pages.manage" // Halaman & beranda
  | "media.manage" // Unggah & hapus media
  | "compliance.manage" // e-Report, audit, legalitas
  | "seo.manage" // SEO & redirect
  | "system.manage"; // Pengguna & pengaturan

/** Matriks peran — satu-satunya sumber kebenaran untuk otorisasi. */
export const ROLE_ABILITIES: Readonly<Record<Role, readonly Ability[]>> = {
  super_admin: [
    "draft.write",
    "content.publish",
    "content.review",
    "pages.manage",
    "media.manage",
    "compliance.manage",
    "seo.manage",
    "system.manage",
  ],
  editor: [
    "draft.write",
    "content.publish",
    "content.review",
    "pages.manage",
    "media.manage",
    "compliance.manage",
    "seo.manage",
  ],
  penulis: ["draft.write", "content.publish", "media.manage"],
  kontributor: ["draft.write"],
  viewer: [],
};

/** Peran yang wajib lolos TOTP sebelum boleh mengakses admin. */
export const TOTP_REQUIRED_ROLES: readonly Role[] = ["super_admin", "editor"];

export function requiresTotp(role: Role): boolean {
  return TOTP_REQUIRED_ROLES.includes(role);
}

export function can(user: { role: Role } | null | undefined, ability: Ability): boolean {
  if (!user) return false;
  return ROLE_ABILITIES[user.role].includes(ability);
}

