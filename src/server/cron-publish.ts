import "server-only";

import { and, eq, lte, sql } from "drizzle-orm";

import { logActivity } from "./activity";
import { getDb, schema } from "./db";

const { posts } = schema;

/**
 * Terbitkan post Terjadwal yang waktunya sudah lewat (dipanggil Vercel Cron tiap 10 menit).
 * UPDATE … RETURNING bersifat atomik: dua pemanggilan bersamaan tidak menerbitkan/mencatat dua kali.
 */
export async function publishDuePosts(now = new Date()): Promise<{ id: number; slug: string; title: string }[]> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const due = await tx
      .update(posts)
      .set({ status: "published", updatedAt: sql`now()` })
      .where(and(eq(posts.status, "scheduled"), lte(posts.publishedAt, now)))
      .returning({ id: posts.id, slug: posts.slug, title: posts.title, publishedAt: posts.publishedAt });
    for (const p of due) {
      await logActivity(
        {
          userId: null,
          action: "publish",
          entity: "post",
          entityId: p.id,
          summary: `Menerbitkan otomatis (jadwal) “${p.title}”`,
          diff: { status: ["scheduled", "published"], publishedAt: [p.publishedAt?.toISOString() ?? null, p.publishedAt?.toISOString() ?? null] },
        },
        tx,
      );
    }
    return due.map(({ id, slug, title }) => ({ id, slug, title }));
  });
}
