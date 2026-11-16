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

/**
 * Segarkan cache publik sebuah halaman. `listChanged` (judul/status berubah atau halaman baru terbit)
 * juga menyegarkan daftar halaman — sitemap dan breadcrumb halaman anak.
 */
export function refreshPageCaches(path: string, listChanged: boolean): void {
  updateTag(CACHE_TAGS.page(path));
  if (listChanged) {
    updateTag(CACHE_TAGS.pages);
    revalidatePath("/sitemap.xml");
  }
}
