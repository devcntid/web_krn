import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import type { Page, PageSummary, Post, PostSummary, Term } from "@/types/content";
import { isDonationAppPath } from "@/config/routes";
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
} as const;

/* ---------- Posts ---------- */

/** Semua post terbit, terbaru dulu. */
export const getAllPosts = cache(
  unstable_cache(async (): Promise<PostSummary[]> => (await listPublishedPosts()).filter((p) => !isDonationAppPath(p.slug)), ["content:posts"], {
    tags: [CACHE_TAGS.posts, CACHE_TAGS.taxonomy],
  }),
);

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  if (isDonationAppPath(slug)) return null;
  return unstable_cache(() => findPublishedPost(slug), ["content:post", slug], { tags: [CACHE_TAGS.posts, CACHE_TAGS.post(slug)] })();
});

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
  unstable_cache(async (): Promise<PageSummary[]> => (await listPublishedPages()).filter((p) => !isDonationAppPath(p.path)), ["content:pages"], {
    tags: [CACHE_TAGS.pages],
  }),
);

export const getPage = cache(async (pagePath: string): Promise<Page | null> => {
  if (isDonationAppPath(pagePath)) return null;
  return unstable_cache(() => findPublishedPage(pagePath), ["content:page", pagePath], { tags: [CACHE_TAGS.pages, CACHE_TAGS.page(pagePath)] })();
});

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
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((current - 1) * perPage, current * perPage),
    page: current,
    totalPages,
    total: items.length,
  };
}
