import "server-only";

import { type SQL, and, asc, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";

import type {
  CategoryOption,
  ContentStatus,
  EditorPost,
  MediaPage,
  RevisionSummary,
  TagRef,
  UserOption,
} from "@/types/admin-posts";
import { getDb, schema } from "../db";

const { categories, media, postCategories, postRevisions, postTags, posts, tags, users } = schema;

/** Tanggal yang ditampilkan/diurutkan: tanggal terbit, atau terakhir diubah untuk yang belum terbit. */
const dateExpr = sql`coalesce(${posts.publishedAt}, ${posts.updatedAt})`;
const monthExpr = sql<string>`to_char(${dateExpr} at time zone 'Asia/Jakarta', 'YYYY-MM')`;

const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ---------- Daftar ---------- */

export type PostListFilters = {
  status: ContentStatus | "all";
  q: string;
  /** Slug kategori. */
  category: string;
  /** UUID pengguna. */
  author: string;
  /** "YYYY-MM" (WIB). */
  month: string;
  sort: { key: "title" | "status" | "date"; dir: "asc" | "desc" };
  page: number;
  pageSize: number;
};

export type AdminPostRow = {
  id: number;
  slug: string;
  title: string;
  status: ContentStatus;
  publishedAt: Date | null;
  authorId: string | null;
  author: string | null;
  thumbnail: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonical: string | null;
  missingAlt: boolean;
  categories: string[];
};

function listConditions(f: Pick<PostListFilters, "status" | "q" | "category" | "author" | "month">): SQL | undefined {
  const where: (SQL | undefined)[] = [f.status === "all" ? ne(posts.status, "trashed") : eq(posts.status, f.status)];
  const q = f.q.trim();
  if (q) where.push(or(ilike(posts.title, likePattern(q)), ilike(posts.slug, likePattern(q))));
  if (f.category) {
    where.push(
      sql`exists (select 1 from ${postCategories} inner join ${categories} on ${categories.id} = ${postCategories.categoryId} where ${postCategories.postId} = ${posts.id} and ${categories.slug} = ${f.category})`,
    );
  }
  if (UUID.test(f.author)) where.push(eq(posts.authorId, f.author));
  if (/^\d{4}-\d{2}$/.test(f.month)) where.push(sql`${monthExpr} = ${f.month}`);
  return and(...where);
}

export async function listAdminPosts(f: PostListFilters): Promise<{ rows: AdminPostRow[]; total: number }> {
  const db = getDb();
  const where = listConditions(f);
  const dir = f.sort.dir === "asc" ? asc : desc;
  const order = f.sort.key === "title" ? dir(posts.title) : f.sort.key === "status" ? dir(posts.status) : dir(dateExpr);

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        status: posts.status,
        publishedAt: posts.publishedAt,
        authorId: posts.authorId,
        author: users.name,
        thumbnail: media.url,
        seoTitle: posts.seoTitle,
        seoDescription: posts.seoDescription,
        canonical: posts.canonical,
        missingAlt: sql<boolean>`${posts.contentHtml} ~* '<img(?![^>]*\\salt="[^"]+")[^>]*>'`,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .leftJoin(media, eq(media.id, posts.featuredMediaId))
      .where(where)
      .orderBy(order, desc(posts.id))
      .limit(f.pageSize)
      .offset((f.page - 1) * f.pageSize),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(posts).where(where),
  ]);

  const catRows = rows.length
    ? await db
        .select({ postId: postCategories.postId, slug: categories.slug, name: categories.name })
        .from(postCategories)
        .innerJoin(categories, eq(categories.id, postCategories.categoryId))
        .where(
          inArray(
            postCategories.postId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(categories.id)
    : [];

  return {
    total: countRow?.n ?? 0,
    rows: rows.map((r) => ({
      ...r,
      // "blog" adalah kategori induk teknis WordPress dan tidak ditampilkan.
      categories: catRows.filter((c) => c.postId === r.id && c.slug !== "blog").map((c) => c.name),
    })),
  };
}

/** Jumlah post per status untuk tab ("all" = semua kecuali sampah). */
export async function countPostsByStatus(): Promise<Record<ContentStatus | "all", number>> {
  const rows = await getDb()
    .select({ status: posts.status, n: sql<number>`count(*)`.mapWith(Number) })
    .from(posts)
    .groupBy(posts.status);
  const out: Record<ContentStatus | "all", number> = { all: 0, draft: 0, review: 0, scheduled: 0, published: 0, trashed: 0 };
  for (const r of rows) {
    out[r.status] = r.n;
    if (r.status !== "trashed") out.all += r.n;
  }
  return out;
}

export async function listCategoryOptions(): Promise<CategoryOption[]> {
  return getDb()
    .select({ id: categories.id, name: categories.name, slug: categories.slug, parentId: categories.parentId })
    .from(categories)
    .where(ne(categories.slug, "blog"))
    .orderBy(categories.name);
}

/** Pengguna aktif (untuk pilihan penulis/reviewer). */
export async function listUserOptions(): Promise<(UserOption & { role: (typeof schema.userRole.enumValues)[number] })[]> {
  const rows = await getDb()
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(isNull(users.disabledAt))
    .orderBy(users.name);
  return rows.map((u) => ({ id: u.id, name: u.name ?? u.email, role: u.role }));
}

/** Pilihan filter daftar: penulis yang punya post dan bulan yang berisi post. */
export async function listPostFilterOptions(): Promise<{ authors: UserOption[]; months: string[] }> {
  const db = getDb();
  const [authorRows, monthRows] = await Promise.all([
    db.selectDistinct({ id: users.id, name: users.name, email: users.email }).from(posts).innerJoin(users, eq(users.id, posts.authorId)),
    db.selectDistinct({ month: monthExpr }).from(posts).where(ne(posts.status, "trashed")).orderBy(desc(monthExpr)),
  ]);
  return {
    authors: authorRows.map((u) => ({ id: u.id, name: u.name ?? u.email })),
    months: monthRows.map((m) => m.month),
  };
}

/* ---------- Editor ---------- */

export async function getEditorPost(id: number): Promise<EditorPost | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      contentJson: posts.contentJson,
      contentHtml: posts.contentHtml,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      authorId: posts.authorId,
      reviewerId: posts.reviewerId,
      featuredMediaId: posts.featuredMediaId,
      seoTitle: posts.seoTitle,
      seoDescription: posts.seoDescription,
      canonical: posts.canonical,
      mediaUrl: media.url,
      mediaAlt: media.alt,
      mediaWidth: media.width,
      mediaHeight: media.height,
    })
    .from(posts)
    .leftJoin(media, eq(media.id, posts.featuredMediaId))
    .where(eq(posts.id, id))
    .limit(1);
  if (!row) return null;

  const [catRows, tagRows] = await Promise.all([
    db.select({ id: postCategories.categoryId }).from(postCategories).where(eq(postCategories.postId, id)),
    db.select({ id: tags.id, name: tags.name }).from(postTags).innerJoin(tags, eq(tags.id, postTags.tagId)).where(eq(postTags.postId, id)).orderBy(tags.name),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentJson: row.contentJson,
    contentHtml: row.contentHtml,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    authorId: row.authorId,
    reviewerId: row.reviewerId,
    featured:
      row.featuredMediaId !== null && row.mediaUrl !== null
        ? { id: row.featuredMediaId, url: row.mediaUrl, alt: row.mediaAlt ?? "", width: row.mediaWidth, height: row.mediaHeight }
        : null,
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    canonical: row.canonical ?? "",
    categoryIds: catRows.map((c) => c.id),
    tags: tagRows,
  };
}

export async function searchTags(q: string, limit = 12): Promise<TagRef[]> {
  const term = q.trim();
  if (!term) return [];
  return getDb()
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(ilike(tags.name, likePattern(term)))
    .orderBy(sql`length(${tags.name})`, tags.name)
    .limit(limit);
}

/** Gambar di pustaka media (terbaru dulu) untuk MediaPicker. */
export async function listMediaImages(q: string, page: number, pageSize = 24): Promise<MediaPage> {
  const db = getDb();
  const term = q.trim();
  const where = and(
    sql`${media.mime} like 'image/%'`,
    term ? or(ilike(media.pathname, likePattern(term)), ilike(media.alt, likePattern(term))) : undefined,
  );
  const [items, [countRow]] = await Promise.all([
    db
      .select({ id: media.id, url: media.url, alt: media.alt, width: media.width, height: media.height })
      .from(media)
      .where(where)
      .orderBy(desc(media.createdAt), desc(media.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(media).where(where),
  ]);
  return { items, total: countRow?.n ?? 0, page, pageSize };
}

/* ---------- Revisi ---------- */

export async function listRevisions(postId: number, limit = 30): Promise<RevisionSummary[]> {
  const rows = await getDb()
    .select({
      id: postRevisions.id,
      createdAt: postRevisions.createdAt,
      author: users.name,
      title: sql<string | null>`${postRevisions.snapshot} ->> 'title'`,
      status: sql<ContentStatus | null>`${postRevisions.snapshot} ->> 'status'`,
    })
    .from(postRevisions)
    .leftJoin(users, eq(users.id, postRevisions.authorId))
    .where(eq(postRevisions.postId, postId))
    .orderBy(desc(postRevisions.createdAt), desc(postRevisions.id))
    .limit(limit);
  return rows.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), author: r.author, title: r.title ?? "", status: r.status }));
}
