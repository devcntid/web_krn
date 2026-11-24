/** HTML editor ↔ teks tersimpan. Tanpa sanitasi: pemanggil server membersihkan dulu. */

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function decodeHtml(value: string): string {
  return value.replace(/&nbsp;/gi, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

export function hasMarkup(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/**
 * Tempelan dari Word/Docs membawa HTML (mso-*, span, font). Salin di dalam editor
 * ditandai `data-pm-slice` dan formatnya dibiarkan.
 */
export function shouldStripHtmlPaste(html: string): boolean {
  if (!html || html.includes("data-pm-slice")) return false;
  return /<[a-z!][\s\S]*>/i.test(html);
}

/** Satu baris tempelan = satu paragraf. Baris kosong dari Word dibuang. */
export function plainLines(text: string): string[] {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[ \t]+|[ \t]+$/g, ""))
    .filter((line) => line.length > 0);
}

/** Cadangan bila clipboard tidak punya text/plain. */
export function htmlClipboardToText(html: string): string {
  const withoutNoise = html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<xml[\s\S]*?<\/xml>/gi, "");
  if (typeof DOMParser === "undefined") {
    return decodeHtml(withoutNoise.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(?:p|div|h[1-6]|li|tr)>/gi, "\n").replace(/<[^>]+>/g, ""));
  }
  const doc = new DOMParser().parseFromString(withoutNoise, "text/html");
  doc.querySelectorAll("style, script, meta, link, title").forEach((node) => node.remove());
  return (doc.body.innerText || doc.body.textContent || "").replace(/\u00a0/g, " ");
}

/** Teks yang terlihat, untuk cek "wajib diisi" di browser. */
export function visibleText(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Paragraf tersimpan (polos atau HTML) menjadi dokumen untuk editor. */
export function paragraphsToHtml(paragraphs: readonly string[]): string {
  if (!paragraphs.length) return "<p></p>";
  return paragraphs.map((p) => (hasMarkup(p) ? p : `<p>${escapeHtml(p)}</p>`)).join("");
}

/**
 * HTML yang sudah bersih dipecah lagi menjadi paragraf.
 * Satu `<p>` tanpa mark disimpan sebagai teks polos agar tampilan lama tidak berubah.
 */
export function splitStoredParagraphs(cleanHtml: string): string[] {
  const compact = cleanHtml.replace(/>\s+</g, "><").trim();
  if (!compact) return [];
  const parts = [...compact.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
  const rebuilt = parts.map((m) => `<p>${m[1]}</p>`).join("");
  if (!parts.length || rebuilt !== compact) return [compact];
  return parts
    .map((m) => {
      const inner = m[1].trim();
      return hasMarkup(inner) ? `<p>${inner}</p>` : decodeHtml(inner);
    })
    .filter((p) => p.trim());
}
