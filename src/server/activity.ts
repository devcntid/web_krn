import "server-only";

import { type Db, getDb, schema } from "./db";

/** Koneksi atau transaksi Drizzle — agar log bisa ikut dalam transaksi yang sama dengan perubahannya. */
export type DbOrTx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export type ActivityEntry = {
  /** Null bila aksi dilakukan sistem (cron). */
  userId: string | null;
  /** create | edit | publish | schedule | submit_review | unpublish | trash | restore | delete | restore_revision | … */
  action: string;
  /** post, page, media, redirect, user, settings, … */
  entity: string;
  entityId?: string | number | null;
  summary: string;
  /** Perubahan sebelum/sesudah: { kolom: [lama, baru] }. */
  diff?: Record<string, unknown> | null;
};

/** Catat satu baris `activity_log`. Dipanggil setiap server action yang mengubah data. */
export async function logActivity(entry: ActivityEntry, db: DbOrTx = getDb()): Promise<void> {
  await db.insert(schema.activityLog).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId === null || entry.entityId === undefined ? null : String(entry.entityId),
    summary: entry.summary,
    diff: entry.diff && Object.keys(entry.diff).length > 0 ? entry.diff : null,
  });
}
