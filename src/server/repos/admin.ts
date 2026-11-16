import "server-only";

import { count, eq } from "drizzle-orm";

import { getDb, schema } from "../db";

/** Jumlah post berstatus `review` untuk badge sidebar. Read-only; gagal → 0 (badge disembunyikan). */
export async function countPostsInReview(): Promise<number> {
  try {
    const [row] = await getDb().select({ n: count() }).from(schema.posts).where(eq(schema.posts.status, "review"));
    return row?.n ?? 0;
  } catch (error) {
    console.error("countPostsInReview gagal", error);
    return 0;
  }
}
