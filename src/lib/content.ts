import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Page, PageSummary, Post, PostSummary, Term } from "@/types/content";

/**
 * Data access untuk konten hasil ekspor WordPress di folder /content.
 * Semua fungsi dipanggil saat build (SSG) atau di server — tidak pernah di client.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

const cache = new Map<string, unknown>();

function readJson<T>(rel: string, fallback: T): T {
  if (cache.has(rel)) return cache.get(rel) as T;
  const file = path.join(CONTENT_DIR, rel);
  let value = fallback;
  if (fs.existsSync(file)) {
    value = JSON.parse(fs.readFileSync(file, "utf8")) as T;
  }
  cache.set(rel, value);
  return value;
}

const safeName = (p: string) => p.replace(/\//g, "__");

/* ---------- Posts ---------- */

/** Semua post, terbaru dulu. */
export function getAllPosts(): PostSummary[] {
  return readJson<PostSummary[]>("posts/index.json", []);
}

export function getPost(slug: string): Post | null {
  return readJson<Post | null>(`posts/${safeName(slug)}.json`, null);
}

export function getLatestPosts(limit: number): PostSummary[] {
  return getAllPosts().slice(0, limit);
}

export function getPostsByCategory(slug: string): PostSummary[] {
  return getAllPosts().filter((p) => p.categories.some((c) => c.slug === slug));
}

export function getPostsByTag(slug: string): PostSummary[] {
  return getAllPosts().filter((p) => p.tags.some((t) => t.slug === slug));
}

export function searchPosts(query: string): PostSummary[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return getAllPosts().filter((p) => {
    const hay = `${p.title} ${p.excerpt}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

/* ---------- Pages ---------- */

export function getAllPages(): PageSummary[] {
  return readJson<PageSummary[]>("pages/index.json", []);
}

export function getPage(pagePath: string): Page | null {
  return readJson<Page | null>(`pages/${safeName(pagePath)}.json`, null);
}

/* ---------- Taxonomies ---------- */

export function getCategories(): Term[] {
  return readJson<Term[]>("categories.json", []);
}

export function getCategoryByPath(termPath: string): Term | undefined {
  return getCategories().find((c) => c.path === termPath);
}

export function getTags(): Term[] {
  return readJson<Term[]>("tags.json", []);
}

export function getTag(slug: string): Term | undefined {
  return getTags().find((t) => t.slug === slug);
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
