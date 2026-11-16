import { optimizeContentImages, rewriteMediaInHtml } from "@/lib/media";

/**
 * Tautan yang di WordPress diketik dengan spasi di depan URL (href=" https://…")
 * terbaca sebagai path relatif dan berakhir di URL yang salah. Spasi dibuang;
 * tautan ke domain sendiri dijadikan path relatif.
 */
function fixLeadingSpaceLinks(html: string): string {
  return html
    .replace(/href="(?:%20|\s)+https?:\/\/(?:www\.)?relawannusantara\.org(\/[^"]*)"/g, 'href="$1"')
    .replace(/href="(?:%20|\s)+(https?:\/\/[^"]*)"/g, 'href="$1"');
}

/**
 * Render HTML konten WordPress yang SUDAH disanitasi saat ekspor
 * (scripts/export-wp.ts — whitelist tag/atribut, tanpa script/style/event handler).
 */
export function RichContent({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div className={`wp-content ${className}`} dangerouslySetInnerHTML={{ __html: rewriteMediaInHtml(optimizeContentImages(fixLeadingSpaceLinks(html))) }} />
  );
}
