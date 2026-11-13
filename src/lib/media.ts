/**
 * URL media WordPress.
 *
 * Default: file ada di public/wp-content/uploads (path asli WordPress).
 * Bila NEXT_PUBLIC_MEDIA_BASE_URL di-set (mis. https://media.relawannusantara.org
 * — bucket R2/S3/Vercel Blob berisi folder wp-content/uploads yang sama), semua
 * path /wp-content/uploads/... diarahkan ke host itu, sehingga 1,6 GB media tidak
 * perlu ikut di repo/deployment.
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
