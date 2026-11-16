import "server-only";

import { desc, eq, inArray, ne, sql } from "drizzle-orm";

import { getDb, schema } from "../db";

const { categories, media, notFoundLog, pages, postCategories, postTags, posts, redirects, tags, users } = schema;

type Status = (typeof schema.contentStatus.enumValues)[number];

/** `count(*) filter (where …)` sebagai number. */
const countWhere = (condition: ReturnType<typeof sql>) => sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
const total = sql<number>`count(*)`.mapWith(Number);

export type DashboardSummary = {
  /** Post selain yang di tempat sampah. */
  posts: { total: number; artikel: number; berita: number };
  pages: { total: number; published: number; draft: number };
  media: { total: number; legacy: number; blob: number };
  taxonomy: { categories: number; tags: number; unusedTags: number };
};

/** Angka 4 kartu ringkasan dasbor. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = getDb();
  const [[postRow], typeRows, [pageRow], [mediaRow], [catRow], [tagRow]] = await Promise.all([
    db.select({ n: total }).from(posts).where(ne(posts.status, "trashed")),
    db
      .select({ slug: categories.slug, n: sql<number>`count(distinct ${posts.id})`.mapWith(Number) })
      .from(postCategories)
      .innerJoin(categories, eq(categories.id, postCategories.categoryId))
      .innerJoin(posts, eq(posts.id, postCategories.postId))
      .where(sql`${categories.slug} in ('artikel', 'berita') and ${posts.status} <> 'trashed'`)
      .groupBy(categories.slug),
    db
      .select({
        n: countWhere(sql`${pages.status} <> 'trashed'`),
        published: countWhere(sql`${pages.status} = 'published'`),
        draft: countWhere(sql`${pages.status} = 'draft'`),
      })
      .from(pages),
    db
      .select({ n: total, legacy: countWhere(sql`${media.source} = 'legacy'`), blob: countWhere(sql`${media.source} = 'blob'`) })
      .from(media),
    db.select({ n: total }).from(categories),
    db
      .select({
        n: total,
        unused: countWhere(sql`not exists (select 1 from ${postTags} where ${postTags.tagId} = ${tags.id})`),
      })
      .from(tags),
  ]);
  const byType = new Map(typeRows.map((r) => [r.slug, r.n]));
  return {
    posts: { total: postRow?.n ?? 0, artikel: byType.get("artikel") ?? 0, berita: byType.get("berita") ?? 0 },
    pages: { total: pageRow?.n ?? 0, published: pageRow?.published ?? 0, draft: pageRow?.draft ?? 0 },
    media: { total: mediaRow?.n ?? 0, legacy: mediaRow?.legacy ?? 0, blob: mediaRow?.blob ?? 0 },
    taxonomy: { categories: catRow?.n ?? 0, tags: tagRow?.n ?? 0, unusedTags: tagRow?.unused ?? 0 },
  };
}

export type DashboardTodos = {
  /** Post berstatus review. */
  review: number;
  /** Post terbit tanpa meta description. */
  missingDescription: number;
  /** Gambar di pustaka media tanpa teks alt. */
  missingAlt: number;
  /** Path di log 404 yang belum punya redirect. */
  unresolved404: number;
};

/** Angka panel "Menunggu tindakan". */
export async function getDashboardTodos(): Promise<DashboardTodos> {
  const db = getDb();
  const [[postRow], [mediaRow], [nfRow]] = await Promise.all([
    db
      .select({
        review: countWhere(sql`${posts.status} = 'review'`),
        missingDescription: countWhere(sql`${posts.status} = 'published' and coalesce(btrim(${posts.seoDescription}), '') = ''`),
      })
      .from(posts),
    db.select({ n: countWhere(sql`${media.mime} like 'image/%' and btrim(${media.alt}) = ''`) }).from(media),
    db
      .select({
        // Bandingkan tanpa slash akhir: log 404 dan redirect bisa berbeda penulisan.
        n: countWhere(
          sql`not exists (select 1 from ${redirects} where rtrim(${redirects.source}, '/') = rtrim(${notFoundLog.path}, '/'))`,
        ),
      })
      .from(notFoundLog),
  ]);
  return {
    review: postRow?.review ?? 0,
    missingDescription: postRow?.missingDescription ?? 0,
    missingAlt: mediaRow?.n ?? 0,
    unresolved404: nfRow?.n ?? 0,
  };
}

export type RecentPost = {
  id: number;
  title: string;
  status: Status;
  /** Nama kategori jenis (Berita/Artikel) atau kategori pertama selain "blog"; null bila tanpa kategori. */
  category: string | null;
  author: string | null;
  publishedAt: Date | null;
};

/** Publikasi terbaru (selain sampah): terjadwal/terbit menurut tanggal terbit, draf menurut terakhir diubah. */
export async function listRecentPosts(limit = 5): Promise<RecentPost[]> {
  const db = getDb();
  const rows = await db
    .select({ id: posts.id, title: posts.title, status: posts.status, publishedAt: posts.publishedAt, author: users.name })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(ne(posts.status, "trashed"))
    .orderBy(desc(sql`coalesce(${posts.publishedAt}, ${posts.updatedAt})`), desc(posts.id))
    .limit(limit);
  if (rows.length === 0) return [];

  const catRows = await db
    .select({ postId: postCategories.postId, slug: categories.slug, name: categories.name })
    .from(postCategories)
    .innerJoin(categories, eq(categories.id, postCategories.categoryId))
    .where(
      inArray(
        postCategories.postId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(categories.id);

  return rows.map((row) => {
    const cats = catRows.filter((c) => c.postId === row.id && c.slug !== "blog");
    const type = cats.find((c) => c.slug === "berita" || c.slug === "artikel");
    return { ...row, category: (type ?? cats[0])?.name ?? null };
  });
}
