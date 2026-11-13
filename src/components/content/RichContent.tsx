/**
 * Render HTML konten WordPress yang SUDAH disanitasi saat ekspor
 * (scripts/export-wp.ts — whitelist tag/atribut, tanpa script/style/event handler).
 */
export function RichContent({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`wp-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
