import "server-only";

import sanitizeHtml from "sanitize-html";

import {
  CONTENT_ALLOWED_ATTRIBUTES,
  CONTENT_ALLOWED_IFRAME_HOSTS,
  CONTENT_ALLOWED_SCHEMES,
  CONTENT_ALLOWED_TAGS,
  CONTENT_NON_TEXT_TAGS,
} from "@/lib/html-whitelist";

const OWN_ORIGIN = /^https?:\/\/(?:www\.)?relawannusantara\.org(?=\/|$)/i;

/**
 * Sanitasi HTML dari editor admin sebelum disimpan ke `content_html`. Whitelist dan
 * aturannya sama dengan ekspor WordPress (scripts/export-wp.ts) sehingga RichContent
 * menerima bentuk HTML yang sama untuk konten lama maupun baru.
 */
export function sanitizeContentHtml(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: CONTENT_ALLOWED_TAGS,
    allowedAttributes: CONTENT_ALLOWED_ATTRIBUTES,
    allowedSchemes: CONTENT_ALLOWED_SCHEMES,
    allowedIframeHostnames: CONTENT_ALLOWED_IFRAME_HOSTS,
    nonTextTags: CONTENT_NON_TEXT_TAGS,
    transformTags: {
      // Satu-satunya H1 adalah judul di hero → H1 konten diturunkan jadi H2.
      h1: "h2",
      a: (tagName, attribs) => {
        // Tautan ke domain sendiri disimpan sebagai path relatif. Tombol lama tanpa URL
        // (<a data-button="true">) dibiarkan tanpa href, sama seperti hasil ekspor.
        const raw = (attribs.href ?? "").trim();
        const href = raw ? raw.replace(OWN_ORIGIN, "") || "/" : "";
        const external = /^https?:\/\//.test(href);
        return {
          tagName,
          attribs: {
            ...(href ? { href } : {}),
            ...(attribs["data-button"] ? { "data-button": "true" } : {}),
            ...(external || attribs.target === "_blank" ? { target: "_blank", rel: "noopener noreferrer" } : {}),
          },
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
    exclusiveFilter: (frame) =>
      (frame.tag === "p" && !frame.text.trim() && !frame.mediaChildren.length) ||
      (frame.tag === "a" && !frame.text.trim() && !frame.mediaChildren.length) ||
      (frame.tag === "img" && !frame.attribs.src) ||
      (frame.tag === "iframe" && !frame.attribs.src),
  });
  return clean
    .replace(LI_SINGLE_PARAGRAPH, "<li>$1</li>")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Editor membungkus isi butir daftar dengan <p> (<li><p>teks</p></li>); konten hasil ekspor
 * memakai <li>teks</li>. Butir yang hanya berisi satu paragraf dikembalikan ke bentuk itu.
 */
const LI_SINGLE_PARAGRAPH = /<li>\s*<p>((?:(?!<\/?(?:p|ul|ol|li)[\s>])[\s\S])*?)<\/p>\s*<\/li>/g;

/** Teks polos dari HTML konten (untuk ringkasan otomatis). */
export function plainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ringkasan otomatis: ±160 karakter pertama, dipotong di batas kata. */
export function autoExcerpt(html: string, max = 160): string {
  const text = plainText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30)).replace(/[\s,.;:–-]+$/, "")}…`;
}
