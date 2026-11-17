/** Tipe bersama server ↔ klien untuk /admin/seo (tanpa kode server). */
export type AdminRedirect = { id: number; source: string; destination: string; statusCode: number; note: string; hits: number; isStatic: boolean };
export type NotFoundEntry = { path: string; hits: number; lastSeen: string };
export type RedirectInput = { source: string; destination: string; statusCode: number; note: string };
export type SeoResult = { ok: true; message: string; warning?: string } | { ok: false; error: string; field?: "source" | "destination" };
export type SeoHealth = {
  postsNoDescription: number;
  postsWithH1: number;
  pagesNoDescription: number;
  mediaNoAlt: number;
  sitemap: { urls: number; posts: number; pages: number; categories: number; english: number };
  edgeConfig: boolean;
};
