import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, desc, eq, gt, isNull, ne, sql } from "drizzle-orm";

import type { AbilityRow, AdminUser, PendingInvite, UserRole, UsersResult } from "@/types/admin-users";
import { logActivity } from "./activity";
import { MIN_PASSWORD_LENGTH, hashPassword } from "./auth/password";
import { getDb, schema } from "./db";
import type { AuthUser } from "./permissions";
import { type Ability, ROLE_ABILITIES, TOTP_REQUIRED_ROLES } from "./roles";

const { invitations, users } = schema;

export const ROLES: readonly UserRole[] = ["super_admin", "editor", "penulis", "kontributor", "viewer"];
export const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

/** Label kemampuan = baris tabel "Peran & hak akses" di docs/BUILD_PLAYBOOK.md. */
const ABILITY_LABEL: Record<Ability, string> = {
  "draft.write": "Menulis draf",
  "content.publish": "Menerbitkan",
  "content.review": "Meninjau & menyetujui",
  "pages.manage": "Halaman & beranda",
  "media.manage": "Unggah & hapus media",
  "compliance.manage": "e-Report, audit, legalitas",
  "seo.manage": "SEO & redirect",
  "system.manage": "Pengguna & pengaturan",
};

/** Matriks hak akses (hanya baca) langsung dari ROLE_ABILITIES. */
export function abilityMatrix(): AbilityRow[] {
  return (Object.keys(ABILITY_LABEL) as Ability[]).map((key) => ({
    key,
    label: ABILITY_LABEL[key],
    roles: Object.fromEntries(ROLES.map((r) => [r, ROLE_ABILITIES[r].includes(key)])) as Record<UserRole, boolean>,
  }));
}

export async function listUsers(self: AuthUser): Promise<AdminUser[]> {
  const rows = await getDb().select().from(users).orderBy(sql`${users.disabledAt} is not null`, sql`array_position(array['super_admin','editor','penulis','kontributor','viewer']::user_role[], ${users.role})`, users.email);
  return rows.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    role: u.role,
    totpEnabled: Boolean(u.totpEnabledAt),
    totpRequired: TOTP_REQUIRED_ROLES.includes(u.role),
    disabled: Boolean(u.disabledAt),
    lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
    isSelf: u.id === self.id,
  }));
}

export async function listPendingInvites(): Promise<PendingInvite[]> {
  const rows = await getDb()
    .select({ id: invitations.id, email: invitations.email, role: invitations.role, expiresAt: invitations.expiresAt, inviter: users.name })
    .from(invitations)
    .leftJoin(users, eq(users.id, invitations.invitedBy))
    .where(and(isNull(invitations.acceptedAt), isNull(invitations.revokedAt)))
    .orderBy(desc(invitations.createdAt));
  const now = Date.now();
  return rows.map((r) => ({ id: r.id, email: r.email, role: r.role, expiresAt: r.expiresAt.toISOString(), expired: r.expiresAt.getTime() <= now, invitedBy: r.inviter }));
}

class UError extends Error {}
const run = async (fn: () => Promise<UsersResult>): Promise<UsersResult> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof UError) return { ok: false, error: error.message };
    console.error("pengguna gagal", error);
    return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  }
};
const isRole = (r: unknown): r is UserRole => typeof r === "string" && (ROLES as readonly string[]).includes(r);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Jumlah Super Admin aktif selain `exceptId`. */
async function otherActiveSuperAdmins(exceptId: string): Promise<number> {
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(users)
    .where(and(eq(users.role, "super_admin"), isNull(users.disabledAt), ne(users.id, exceptId)));
  return row?.n ?? 0;
}
async function target(id: string) {
  const [u] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) throw new UError("Pengguna tidak ditemukan.");
  return u;
}
async function guardLastSuperAdmin(u: { id: string; role: UserRole; disabledAt: Date | null }, what: string) {
  if (u.role === "super_admin" && !u.disabledAt && (await otherActiveSuperAdmins(u.id)) === 0) throw new UError(`Tidak bisa ${what} Super Admin aktif terakhir.`);
}

/* ---------- Undangan ---------- */

/** Kirim email undangan lewat Resend bila RESEND_API_KEY & EMAIL_FROM di-set; false bila tidak dikirim. */
async function sendInviteEmail(to: string, link: string, role: UserRole): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: "Undangan Admin CMS Relawan Nusantara",
        text: `Anda diundang sebagai ${role.replace("_", " ")} di Admin CMS Relawan Nusantara.\n\nBuat akun Anda di tautan berikut (berlaku 72 jam, sekali pakai):\n${link}\n\nAbaikan email ini bila Anda tidak merasa diundang.`,
      }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function inviteUser(admin: AuthUser, emailInput: string, role: unknown, origin: string) {
  return run(async () => {
    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new UError("Alamat email tidak sah.");
    if (!isRole(role)) throw new UError("Peran tidak dikenal.");
    const db = getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
    if (existing) throw new UError("Email ini sudah punya akun.");
    // Undangan lama yang belum dipakai untuk email ini dibatalkan.
    await db.update(invitations).set({ revokedAt: new Date() }).where(and(sql`lower(${invitations.email}) = ${email}`, isNull(invitations.acceptedAt), isNull(invitations.revokedAt)));
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const [row] = await db.insert(invitations).values({ email, role, tokenHash: hashToken(token), expiresAt, invitedBy: admin.id }).returning({ id: invitations.id });
    const link = `${origin.replace(/\/$/, "")}/admin/login/undangan/${token}/`;
    const emailed = await sendInviteEmail(email, link, role);
    await logActivity({ userId: admin.id, action: "invite", entity: "user", entityId: row?.id, summary: `Mengundang ${email} sebagai ${role}${emailed ? " (email terkirim)" : ""}` });
    return { ok: true, message: emailed ? `Undangan dikirim ke ${email}.` : `Undangan dibuat. Salin tautannya dan kirim ke ${email}.`, link, emailed };
  });
}

export function revokeInvite(admin: AuthUser, id: string) {
  return run(async () => {
    const [row] = await getDb().update(invitations).set({ revokedAt: new Date() }).where(and(eq(invitations.id, id), isNull(invitations.acceptedAt))).returning({ email: invitations.email });
    if (!row) throw new UError("Undangan tidak ditemukan.");
    await logActivity({ userId: admin.id, action: "revoke", entity: "user", entityId: id, summary: `Membatalkan undangan ${row.email}` });
    return { ok: true, message: "Undangan dibatalkan." };
  });
}

/** Undangan yang masih berlaku untuk token ini (untuk halaman terima undangan). */
export async function findValidInvite(token: string) {
  if (!/^[\w-]{20,100}$/.test(token)) return null;
  const [row] = await getDb()
    .select({ id: invitations.id, email: invitations.email, role: invitations.role })
    .from(invitations)
    .where(and(eq(invitations.tokenHash, hashToken(token)), isNull(invitations.acceptedAt), isNull(invitations.revokedAt), gt(invitations.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

/** Terima undangan: buat akun dengan nama & password. 2FA didaftarkan saat login pertama (peran wajib 2FA). */
export function acceptInvite(token: string, nameInput: string, password: string) {
  return run(async () => {
    const name = nameInput.trim().replace(/\s+/g, " ").slice(0, 120);
    if (!name) throw new UError("Nama wajib diisi.");
    if (password.length < MIN_PASSWORD_LENGTH) throw new UError(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
    if (password.length > 200) throw new UError("Password terlalu panjang.");
    const invite = await findValidInvite(token);
    if (!invite) throw new UError("Tautan undangan tidak berlaku (kedaluwarsa, sudah dipakai, atau dibatalkan).");
    const passwordHash = await hashPassword(password);
    return getDb().transaction(async (tx) => {
      const [used] = await tx.update(invitations).set({ acceptedAt: new Date() }).where(and(eq(invitations.id, invite.id), isNull(invitations.acceptedAt))).returning({ id: invitations.id });
      if (!used) throw new UError("Tautan undangan sudah dipakai.");
      const [existing] = await tx.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${invite.email.toLowerCase()}`).limit(1);
      if (existing) throw new UError("Email ini sudah punya akun. Silakan masuk.");
      const [user] = await tx.insert(users).values({ email: invite.email, name, role: invite.role, passwordHash }).returning({ id: users.id });
      await logActivity({ userId: user?.id ?? null, action: "create", entity: "user", entityId: user?.id, summary: `${invite.email} menerima undangan sebagai ${invite.role}` }, tx);
      return { ok: true as const, message: "Akun dibuat. Silakan masuk." };
    });
  });
}

/* ---------- Kelola pengguna ---------- */

export function changeRole(admin: AuthUser, id: string, role: unknown) {
  return run(async () => {
    if (!isRole(role)) throw new UError("Peran tidak dikenal.");
    const u = await target(id);
    if (u.role === role) return { ok: true, message: "Peran tidak berubah." };
    if (u.role === "super_admin") await guardLastSuperAdmin(u, "menurunkan peran");
    await getDb().update(users).set({ role }).where(eq(users.id, id));
    await logActivity({ userId: admin.id, action: "edit", entity: "user", entityId: id, summary: `Mengubah peran ${u.email}: ${u.role} → ${role}`, diff: { role: [u.role, role] } });
    const needs2fa = TOTP_REQUIRED_ROLES.includes(role) && !u.totpEnabledAt;
    return { ok: true, message: `Peran ${u.email} diubah.${needs2fa ? " Peran ini wajib 2FA: ia akan diminta mendaftarkannya saat masuk." : ""}` };
  });
}

export function setDisabled(admin: AuthUser, id: string, disabled: boolean) {
  return run(async () => {
    const u = await target(id);
    if (id === admin.id && disabled) throw new UError("Anda tidak bisa menonaktifkan akun sendiri.");
    if (disabled) await guardLastSuperAdmin(u, "menonaktifkan");
    await getDb().update(users).set({ disabledAt: disabled ? new Date() : null }).where(eq(users.id, id));
    await logActivity({ userId: admin.id, action: disabled ? "disable" : "enable", entity: "user", entityId: id, summary: `${disabled ? "Menonaktifkan" : "Mengaktifkan"} ${u.email}` });
    return { ok: true, message: disabled ? `${u.email} dinonaktifkan dan langsung keluar dari admin.` : `${u.email} diaktifkan kembali.` };
  });
}

export function resetTotp(admin: AuthUser, id: string) {
  return run(async () => {
    const u = await target(id);
    await getDb().update(users).set({ totpSecret: null, totpEnabledAt: null, totpLastStep: null }).where(eq(users.id, id));
    await logActivity({ userId: admin.id, action: "reset_2fa", entity: "user", entityId: id, summary: `Mereset 2FA ${u.email}` });
    return { ok: true, message: `2FA ${u.email} direset. Ia akan mendaftarkan ulang saat masuk berikutnya.` };
  });
}

export function deleteUser(admin: AuthUser, id: string) {
  return run(async () => {
    const u = await target(id);
    if (id === admin.id) throw new UError("Anda tidak bisa menghapus akun sendiri.");
    await guardLastSuperAdmin(u, "menghapus");
    await getDb().delete(users).where(eq(users.id, id));
    await logActivity({ userId: admin.id, action: "delete", entity: "user", entityId: id, summary: `Menghapus pengguna ${u.email}`, diff: { email: u.email, role: u.role } });
    return { ok: true, message: `${u.email} dihapus. Konten yang ditulisnya tetap ada tanpa nama penulis.` };
  });
}
