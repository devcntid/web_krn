import { legacyRedirects } from "@/config/redirects";

/** Kode redirect yang bisa dikelola di /admin/seo. 410 = "sudah dihapus" (tanpa tujuan). */
export const REDIRECT_CODES = [301, 302, 410] as const;
export type RedirectCode = (typeof REDIRECT_CODES)[number];

/** Path redirect: slash depan, slash belakang (situs memakai trailingSlash), tanpa query/hash, huruf kecil tidak dipaksa. */
export function normalizeRedirectPath(input: string): string {
  let p = input.trim();
  p = p.replace(/^https?:\/\/(?:www\.)?relawannusantara\.org/i, "");
  p = p.split(/[?#]/)[0] ?? "";
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/");
  // File (mis. /a.xml, /b.pdf) tidak diberi slash belakang.
  if (!p.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(p)) p = `${p}/`;
  return p;
}

/** Sumber redirect statis di next.config (pola dengan ":" tidak bisa disunting di admin). */
export const STATIC_REDIRECT_SOURCES: ReadonlySet<string> = new Set(legacyRedirects.map((r) => r.source));
export const isStaticRedirect = (source: string) => STATIC_REDIRECT_SOURCES.has(source) || source.includes(":");

/** Path yang tidak boleh dijadikan sumber redirect (milik aplikasi & sistem). */
export function forbiddenSource(path: string): string | null {
  if (path === "/") return "Beranda tidak bisa dialihkan.";
  if (/^\/(admin|api|_next|en\/admin)(\/|$)/.test(path)) return "Path admin/API/sistem tidak bisa dialihkan.";
  if (/^\/(campaign|donasi|prog)/.test(path)) return "Path aplikasi donasi tidak dilayani situs ini.";
  return null;
}
