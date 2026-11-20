import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import type { Page, PageSummary, Post, PostSummary, Term } from "@/types/content";
import { isDonationAppPath } from "@/config/routes";
import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/request";
import { getCurrentUser } from "@/server/permissions";
import { findPublishedPage, listPublishedPages } from "@/server/repos/pages";
import { findPublishedPost, listPublishedPosts } from "@/server/repos/posts";
import { listCategories, listTags } from "@/server/repos/taxonomy";

/**
 * Fasad data publik. Sejak prompt B2 sumbernya database (src/server/repos/*), bukan
 * lagi file JSON di /content — karena itu semua fungsi kini async (nama & parameternya
 * tetap). Dipanggil saat build (SSG) atau di server, tidak pernah di client.
 *
 * Cache: `unstable_cache` dengan tag per entitas (lihat CACHE_TAGS). Tanpa masa berlaku —
 * data disegarkan oleh admin lewat `revalidateTag` saat konten terbit/berubah.
 * `cache()` dari React menghilangkan query ganda dalam satu render.
 */
export const CACHE_TAGS = {
  posts: "posts",
  post: (slug: string) => `post:${slug}`,
  pages: "pages",
  page: (path: string) => `page:${path}`,
  taxonomy: "taxonomy",
  settings: "settings",
  /** Laporan penyaluran, audit, dan dokumen legalitas (tabel reports, audits, legal_docs). */
  transparency: "transparency",
} as const;

/* ---------- Posts ---------- */

const allPosts = cache((locale: Locale) =>
  unstable_cache(async (): Promise<PostSummary[]> => (await listPublishedPosts(locale)).filter((p) => !isDonationAppPath(p.slug)), ["content:posts", locale], {
    tags: [CACHE_TAGS.posts, CACHE_TAGS.taxonomy],
  })(),
);

/** Semua post terbit, terbaru dulu. Di versi Inggris, judul & ringkasan memakai terjemahan bila ada. */
export const getAllPosts = (): Promise<PostSummary[]> => allPosts(getLocale());

const postBySlug = cache((slug: string, locale: Locale) =>
  unstable_cache(() => findPublishedPost(slug, locale), ["content:post", slug, locale], { tags: [CACHE_TAGS.posts, CACHE_TAGS.post(slug)] })(),
);

/** Satu post dalam bahasa halaman saat ini (isi Indonesia bila belum diterjemahkan). */
export async function getPost(slug: string): Promise<Post | null> {
  if (isDonationAppPath(slug)) return null;
  return postBySlug(slug, getLocale());
}

/**
 * Pratinjau Draft Mode: post apa pun statusnya (kecuali sampah), langsung dari database tanpa cache.
 * Hanya untuk pengguna admin yang sudah masuk — cookie Draft Mode saja tidak cukup.
 */
export async function getPostPreview(slug: string): Promise<Post | null> {
  if (isDonationAppPath(slug)) return null;
  if (!(await getCurrentUser())) return null;
  return findPublishedPost(slug, getLocale(), true);
}

export async function getLatestPosts(limit: number): Promise<PostSummary[]> {
  return (await getAllPosts()).slice(0, limit);
}

export async function getPostsByCategory(slug: string): Promise<PostSummary[]> {
  return (await getAllPosts()).filter((p) => p.categories.some((c) => c.slug === slug));
}

export async function getPostsByTag(slug: string): Promise<PostSummary[]> {
  return (await getAllPosts()).filter((p) => p.tags.some((t) => t.slug === slug));
}

export async function searchPosts(query: string): Promise<PostSummary[]> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return (await getAllPosts()).filter((p) => {
    const hay = `${p.title} ${p.excerpt}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

/* ---------- Pages ---------- */

export const getAllPages = cache(
  unstable_cache(async (): Promise<PageSummary[]> => (await listPublishedPages()).filter((p) => !isDonationAppPath(p.path)), ["content:pages:v2"], {
    tags: [CACHE_TAGS.pages],
  }),
);

export const getPage = cache(async (pagePath: string): Promise<Page | null> => {
  if (isDonationAppPath(pagePath)) return null;
  return unstable_cache(() => findPublishedPage(pagePath), ["content:page:v2", pagePath], { tags: [CACHE_TAGS.pages, CACHE_TAGS.page(pagePath)] })();
});

/** Pratinjau Draft Mode untuk halaman: termasuk draf, tanpa cache, hanya untuk admin yang sudah masuk. */
export async function getPagePreview(pagePath: string): Promise<Page | null> {
  if (isDonationAppPath(pagePath)) return null;
  if (!(await getCurrentUser())) return null;
  return findPublishedPage(pagePath, true);
}

/* ---------- Taxonomies ---------- */

export const getCategories = cache(unstable_cache(listCategories, ["content:categories"], { tags: [CACHE_TAGS.taxonomy, CACHE_TAGS.posts] }));

export async function getCategoryByPath(termPath: string): Promise<Term | undefined> {
  return (await getCategories()).find((c) => c.path === termPath);
}

export const getTags = cache(unstable_cache(listTags, ["content:tags"], { tags: [CACHE_TAGS.taxonomy, CACHE_TAGS.posts] }));

export async function getTag(slug: string): Promise<Term | undefined> {
  return (await getTags()).find((t) => t.slug === slug);
}

/**
 * Kategori yang paling sering muncul pada sekumpulan post (untuk chip "Kategori terkait").
 * Kategori yang terlalu umum ("blog" serta jenis "berita"/"artikel") dan slug di `exclude` dilewati.
 */
export async function getRelatedCategories(posts: PostSummary[], exclude: string[] = [], limit = 5): Promise<Term[]> {
  const skip = new Set(["blog", "berita", "artikel", ...exclude]);
  const tally = new Map<string, number>();
  for (const post of posts) {
    for (const c of post.categories) {
      if (!skip.has(c.slug)) tally.set(c.slug, (tally.get(c.slug) ?? 0) + 1);
    }
  }
  const bySlug = new Map((await getCategories()).map((c) => [c.slug, c]));
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => bySlug.get(slug))
    .filter((t): t is Term => Boolean(t && t.count > 0))
    .slice(0, limit);
}

/* ---------- Pagination ---------- */

export function paginate<T>(items: T[], page: number, perPage: number) {
  const size = Number.isInteger(perPage) && perPage > 0 ? perPage : 1;
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  // Pecahan (mis. ?hal=2.2) bukan halaman: jatuhkan ke 1, jangan potong array di offset pecahan.
  const current = Number.isInteger(page) && page >= 1 ? Math.min(page, totalPages) : 1;
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: current,
    totalPages,
    total: items.length,
  };
}
