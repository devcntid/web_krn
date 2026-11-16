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

/** Lebar yang diizinkan optimizer Next (deviceSizes bawaan) untuk gambar di dalam konten. */
const CONTENT_IMAGE_WIDTHS = [640, 828, 1200];
const CONTENT_IMAGE_SIZES = "(min-width: 1024px) 720px, 90vw";

const optimizedUrl = (src: string, width: number) =>
  `/_next/image?url=${encodeURIComponent(mediaUrl(src))}&w=${width}&q=75`;

/**
 * Gambar di dalam HTML konten (tag <img> biasa hasil ekspor) menunjuk file asli
 * WordPress yang sering berukuran 2560px. Di sini src diarahkan ke optimizer
 * Next (/_next/image) dan diberi srcset + sizes agar perangkat mengunduh ukuran
 * yang sesuai dalam format AVIF/WebP. GIF & SVG dibiarkan apa adanya.
 * Dipanggil SEBELUM rewriteMediaInHtml.
 */
export function optimizeContentImages(html: string): string {
  return html.replace(/<img\b([^>]*?)\ssrc="(\/wp-content\/uploads\/[^"]+\.(?:jpe?g|png|webp))"([^>]*)>/gi, (tag, before: string, src: string, after: string) => {
    const attrs = `${before}${after}`;
    if (/\ssrcset=/.test(attrs)) return tag;
    const decoded = src.replace(/&amp;/g, "&");
    const srcset = CONTENT_IMAGE_WIDTHS.map((w) => `${optimizedUrl(decoded, w)} ${w}w`).join(", ").replace(/&/g, "&amp;");
    const fallback = optimizedUrl(decoded, CONTENT_IMAGE_WIDTHS[CONTENT_IMAGE_WIDTHS.length - 1]).replace(/&/g, "&amp;");
    const lazy = /\sloading=/.test(attrs) ? "" : ' loading="lazy"';
    return `<img${before} src="${fallback}" srcset="${srcset}" sizes="${CONTENT_IMAGE_SIZES}" decoding="async"${lazy}${after}>`;
  });
}
