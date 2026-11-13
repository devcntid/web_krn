/**
 * URL media WordPress.
 *
 * Semua media disimpan di Vercel Blob (docs/MEDIA.md).
 * - Gambar LAMA (migrasi WordPress): konten menyimpan path /wp-content/uploads/...;
 *   di sini diberi host Blob dari NEXT_PUBLIC_MEDIA_BASE_URL
 *   (https://<store-id>.public.blob.vercel-storage.com). Kosongkan saat development
 *   untuk membaca public/wp-content/uploads lokal.
 * - Gambar BARU: sudah berupa URL absolut Blob, dipakai apa adanya.
 */
export const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/$/, "");

const UPLOADS = "/wp-content/uploads/";

export function mediaUrl(src: string): string {
  if (!MEDIA_BASE_URL || !src.startsWith(UPLOADS)) return src;
  return `${MEDIA_BASE_URL}${src}`;
}

/** Ganti path media di HTML konten hasil ekspor. */
export function rewriteMediaInHtml(html: string): string {
  if (!MEDIA_BASE_URL) return html;
  return html.replace(/(["'(])\/wp-content\/uploads\//g, `$1${MEDIA_BASE_URL}${UPLOADS}`);
}
