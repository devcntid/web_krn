/**
 * URL media WordPress.
 *
 * - Gambar LAMA (migrasi WordPress): path /wp-content/uploads/... diarahkan ke
 *   NEXT_PUBLIC_MEDIA_BASE_URL (produksi: https://media.relawannusantara.org).
 *   Kosongkan saat development untuk membaca public/wp-content/uploads lokal.
 * - Gambar BARU: URL absolut Vercel Blob, dipakai apa adanya (lihat docs/MEDIA.md).
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
