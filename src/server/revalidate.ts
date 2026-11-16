import "server-only";

import { revalidatePath, updateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/content";

/**
 * Segarkan cache publik setelah post terbit/berubah/dihapus — dipanggil dari Server Action.
 * `updateTag` (bukan revalidateTag) agar admin langsung melihat hasilnya di situs.
 * Tag `posts` mencakup daftar, arsip kategori/tag, dan sitemap; `taxonomy` mencakup jumlah per kategori.
 */
export function refreshPostCaches(slugs: readonly string[]): void {
  if (!slugs.length) return;
  for (const slug of new Set(slugs)) updateTag(CACHE_TAGS.post(slug));
  updateTag(CACHE_TAGS.posts);
  updateTag(CACHE_TAGS.taxonomy);
  revalidatePath("/sitemap.xml");
}
