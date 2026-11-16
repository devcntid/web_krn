import "server-only";

import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";

import { getDb, schema } from "../db";

/**
 * Rate limit login berbasis Postgres (tabel auth_attempts) — tanpa infrastruktur baru.
 * Hanya percobaan GAGAL yang dicatat; dihitung dalam jendela geser.
 */
export const WINDOW_MS = 15 * 60 * 1000;
export const LIMITS = { email: 5, ip: 20, totp: 5 } as const;

type Kind = keyof typeof LIMITS;
type Db = Pick<ReturnType<typeof getDb>, "select" | "insert" | "delete">;

export function attemptKey(kind: Kind, value: string): string {
  return `${kind}:${value.trim().toLowerCase()}`;
}

/** true bila salah satu kunci sudah melewati batas. */
export async function isRateLimited(keys: { kind: Kind; value: string }[], db: Db = getDb(), now = new Date()): Promise<boolean> {
  if (keys.length === 0) return false;
  const since = new Date(now.getTime() - WINDOW_MS);
  const rows = await db
    .select({ key: schema.authAttempts.key, n: sql<number>`count(*)::int` })
    .from(schema.authAttempts)
    .where(
      and(
        inArray(
          schema.authAttempts.key,
          keys.map((k) => attemptKey(k.kind, k.value)),
        ),
        gt(schema.authAttempts.createdAt, since),
      ),
    )
    .groupBy(schema.authAttempts.key);
  return rows.some((r) => {
    const kind = r.key.slice(0, r.key.indexOf(":")) as Kind;
    return r.n >= LIMITS[kind];
  });
}

export async function recordFailure(keys: { kind: Kind; value: string }[], db: Db = getDb()): Promise<void> {
  if (keys.length === 0) return;
  await db.insert(schema.authAttempts).values(keys.map((k) => ({ key: attemptKey(k.kind, k.value) })));
  // Bersihkan baris kedaluwarsa sesekali agar tabel tetap kecil.
  if (Math.random() < 0.05) {
    await db.delete(schema.authAttempts).where(lt(schema.authAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  }
}

/** Setelah berhasil: reset hitungan akun (bukan IP). */
export async function clearFailures(kind: Exclude<Kind, "ip">, value: string, db: Db = getDb()): Promise<void> {
  await db.delete(schema.authAttempts).where(eq(schema.authAttempts.key, attemptKey(kind, value)));
}

/** IP klien dari header proxy (Vercel mengisi x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
