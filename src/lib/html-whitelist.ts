/**
 * Whitelist HTML konten — satu sumber untuk ekspor WordPress (scripts/export-wp.ts)
 * dan editor admin (src/server/content/sanitize.ts), agar keduanya menghasilkan HTML
 * dengan bentuk yang sama untuk RichContent.
 */
export const CONTENT_ALLOWED_TAGS = [
  "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "a", "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "ul", "ol", "li", "blockquote", "figure", "figcaption", "img", "iframe", "table", "thead", "tbody",
  "tfoot", "tr", "th", "td", "caption", "details", "summary", "code", "pre", "mark",
];

export const CONTENT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "target", "rel", "data-button"],
  img: ["src", "alt", "width", "height", "loading"],
  iframe: ["src", "title", "allow", "allowfullscreen"],
  th: ["colspan", "rowspan"],
  td: ["colspan", "rowspan"],
};

export const CONTENT_ALLOWED_SCHEMES = ["http", "https", "mailto", "tel"];

export const CONTENT_ALLOWED_IFRAME_HOSTS = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com", "www.google.com"];

export const CONTENT_NON_TEXT_TAGS = ["style", "script", "textarea", "option", "noscript", "svg", "form", "button"];
