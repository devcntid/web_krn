/** Skema konten hasil ekspor WordPress (lihat scripts/export-wp.ts). */

export type MediaRef = {
  /** Path lokal, mis. /wp-content/uploads/2026/11/foto.jpg */
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type SeoMeta = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  publishedTime?: string;
  modifiedTime?: string;
  /** JSON-LD asli Rank Math (sudah di-rewrite ke path relatif bila perlu) */
  jsonLd?: unknown[];
};

export type TermRef = { slug: string; name: string };

export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  date: string;
  modified: string;
  excerpt: string;
  featuredImage: MediaRef | null;
  categories: TermRef[];
  tags: TermRef[];
};

export type Post = PostSummary & {
  html: string;
  seo: SeoMeta;
};

export type PageSummary = {
  id: number;
  /** Path penuh tanpa slash depan/belakang, mis. "pr0gram-kami/kerelawanan" */
  path: string;
  slug: string;
  title: string;
  modified: string;
};

export type Page = PageSummary & {
  html: string;
  seo: SeoMeta;
};

export type Term = {
  id: number;
  slug: string;
  /** Path arsip, mis. "hewan-lingkungan/air-bersih" */
  path: string;
  name: string;
  description: string;
  count: number;
  parent: number;
};
