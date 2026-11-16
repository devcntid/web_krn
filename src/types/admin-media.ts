/** Tipe bersama server ↔ klien untuk /admin/media (tanpa kode server). */

export type MediaItem = {
  id: number;
  /** URL Blob atau path lama /wp-content/uploads/… (tampilkan lewat mediaUrl()). */
  url: string;
  pathname: string;
  /** Nama file (segmen terakhir pathname). */
  name: string;
  mime: string;
  size: number | null;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string;
  source: "legacy" | "blob";
};

export type MediaUsage = {
  /** post | page | settings | report | audit */
  kind: "post" | "page" | "settings" | "report" | "audit";
  label: string;
  /** Tautan admin ke konten yang memakainya. */
  href: string | null;
};

export type MediaDetail = { item: MediaItem; uploadedBy: string | null; uploadedAt: string; usage: MediaUsage[] };

export type MediaListFilters = { q: string; kind: "" | "image" | "pdf" | "video"; folder: string; noAlt: boolean; page: number };

export type MediaActionResult = { ok: true; item?: MediaItem } | { ok: false; error: string; usage?: MediaUsage[] };
