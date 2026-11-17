import "server-only";

import { revalidatePath, updateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/content";

/**
 * Segarkan arsip setelah kategori/tag berubah. Daftar istilah (`taxonomy`) dibaca semua arsip,
 * kartu publikasi, dan sitemap; halaman arsip yang terkait juga dirender ulang (id & en).
 * `postSlugs` = publikasi yang kategorinya berubah (label kategori di halaman post).
 */
export function refreshTaxonomyCaches(archives: readonly string[], postSlugs: readonly string[] = []): void {
  updateTag(CACHE_TAGS.taxonomy);
  updateTag(CACHE_TAGS.posts);
  for (const slug of new Set(postSlugs)) updateTag(CACHE_TAGS.post(slug));
  for (const path of new Set(archives)) {
    revalidatePath(path);
    revalidatePath(`/en${path}`);
  }
  revalidatePath("/sitemap.xml");
}
