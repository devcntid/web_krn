import "server-only";

import { and, desc, eq } from "drizzle-orm";

import type { MediaRef, Post, PostSummary, SeoMeta, TermRef } from "@/types/content";
import { getDb, schema } from "../db";
import { wibText } from "./shared";

const { categories, media, postCategories, postTags, postTranslations, posts, tags } = schema;

const summaryColumns = {
  rowId: posts.id,
  legacyId: posts.legacyId,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  date: wibText(posts.publishedAt),
  modified: wibText(posts.updatedAt),
  mediaUrl: media.url,
  mediaWidth: media.width,
  mediaHeight: media.height,
  mediaAlt: media.alt,
};

type SummaryRow = {
  rowId: number;
  legacyId: number | null;
  slug: string;
  title: string;
  excerpt: string;
  date: string | null;
  modified: string;
  mediaUrl: string | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
  mediaAlt: string | null;
};

function toSummary(row: SummaryRow, cats: TermRef[], tagRefs: TermRef[]): PostSummary {
  const featuredImage: MediaRef | null = row.mediaUrl
    ? { src: row.mediaUrl, width: row.mediaWidth ?? 1200, height: row.mediaHeight ?? 675, alt: row.mediaAlt || row.title }
    : null;
  return {
    id: row.legacyId ?? row.rowId,
    slug: row.slug,
    title: row.title,
    date: row.date ?? row.modified,
    modified: row.modified,
    excerpt: row.excerpt,
    featuredImage,
    categories: cats,
    tags: tagRefs,
  };
}

const published = eq(posts.status, "published");

/** Semua post terbit (terbaru dulu) beserta kategori & tag — tiga query, dirangkai di memori. */
export async function listPublishedPosts(locale = "id"): Promise<PostSummary[]> {
  const db = getDb();
  const [rows, catRows, tagRows, trRows] = await Promise.all([
    db.select(summaryColumns).from(posts).leftJoin(media, eq(media.id, posts.featuredMediaId)).where(published).orderBy(desc(posts.publishedAt), desc(posts.id)),
    db
      .select({ postId: postCategories.postId, slug: categories.slug, name: categories.name })
      .from(postCategories)
      .innerJoin(categories, eq(categories.id, postCategories.categoryId))
      .orderBy(categories.id),
    db.select({ postId: postTags.postId, slug: tags.slug, name: tags.name }).from(postTags).innerJoin(tags, eq(tags.id, postTags.tagId)).orderBy(tags.id),
    locale === "id"
      ? []
      : db
          .select({ postId: postTranslations.postId, title: postTranslations.title, excerpt: postTranslations.excerpt, status: postTranslations.status })
          .from(postTranslations)
          .where(eq(postTranslations.locale, locale)),
  ]);
  const translations = new Map(trRows.map((t) => [t.postId, t]));

  const group = (list: { postId: number; slug: string; name: string }[]) => {
    const map = new Map<number, TermRef[]>();
    for (const r of list) {
      const refs = map.get(r.postId) ?? [];
      refs.push({ slug: r.slug, name: r.name });
      map.set(r.postId, refs);
    }
    return map;
  };
  const catsByPost = group(catRows);
  const tagsByPost = group(tagRows);
  return rows.map((r) => {
    const summary = toSummary(r, catsByPost.get(r.rowId) ?? [], tagsByPost.get(r.rowId) ?? []);
    const tr = translations.get(r.rowId);
    return tr ? { ...summary, title: tr.title, excerpt: tr.excerpt || summary.excerpt, translation: tr.status } : summary;
  });
}

/** Satu post terbit lengkap dengan HTML dan SEO; null bila tidak ada. */
export async function findPublishedPost(slug: string, locale = "id"): Promise<Post | null> {
  const db = getDb();
  const [row] = await db
    .select({
      ...summaryColumns,
      html: posts.contentHtml,
      seoTitle: posts.seoTitle,
      seoDescription: posts.seoDescription,
      ogImage: posts.ogImage,
      canonical: posts.canonical,
      robots: posts.robots,
      legacyJsonld: posts.legacyJsonld,
    })
    .from(posts)
    .leftJoin(media, eq(media.id, posts.featuredMediaId))
    .where(and(eq(posts.slug, slug), published))
    .limit(1);
  if (!row) return null;

  const [cats, tagRefs] = await Promise.all([
    db.select({ slug: categories.slug, name: categories.name }).from(postCategories).innerJoin(categories, eq(categories.id, postCategories.categoryId)).where(eq(postCategories.postId, row.rowId)).orderBy(categories.id),
    db.select({ slug: tags.slug, name: tags.name }).from(postTags).innerJoin(tags, eq(tags.id, postTags.tagId)).where(eq(postTags.postId, row.rowId)).orderBy(tags.id),
  ]);

  const seo: SeoMeta = {
    title: row.seoTitle ?? "",
    description: row.seoDescription ?? "",
    canonical: row.canonical ?? `/${row.slug}/`,
    robots: row.robots ?? "",
    ogTitle: row.seoTitle ?? undefined,
    ogDescription: row.seoDescription ?? undefined,
    ogImage: row.ogImage ?? undefined,
    ogType: "article",
    publishedTime: row.date ? `${row.date}+07:00` : undefined,
    modifiedTime: `${row.modified}+07:00`,
    jsonLd: Array.isArray(row.legacyJsonld) ? (row.legacyJsonld as unknown[]) : undefined,
  };
  const post: Post = { ...toSummary(row, cats, tagRefs), html: row.html, seo };
  if (locale === "id") return post;

  const [tr] = await db
    .select()
    .from(postTranslations)
    .where(and(eq(postTranslations.postId, row.rowId), eq(postTranslations.locale, locale)))
    .limit(1);
  if (!tr) return post;
  return {
    ...post,
    title: tr.title,
    excerpt: tr.excerpt || post.excerpt,
    html: tr.contentHtml || post.html,
    translation: tr.status,
    seo: { ...seo, title: tr.seoTitle ?? `${tr.title} - Relawan Nusantara`, description: tr.seoDescription ?? (tr.excerpt || seo.description), ogTitle: tr.seoTitle ?? tr.title, ogDescription: tr.seoDescription ?? undefined },
  };
}
