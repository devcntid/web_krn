import { isDonationAppPath } from "@/config/routes";

/** Bahasa situs. Indonesia = bawaan (URL tanpa prefiks); Inggris di bawah /en/. */
export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";

export const isLocale = (value: string | undefined): value is Locale => LOCALES.includes(value as Locale);

/** Bahasa dari path URL publik: "/en/…" → en, selain itu id. */
export const localeFromPathname = (pathname: string): Locale => (/^\/en(\/|$)/.test(pathname) ? "en" : "id");

/**
 * Path tanpa prefiks bahasa: "/en/berita/" → "/berita/". Saat prerender, usePathname()
 * mengembalikan path internal hasil rewrite ("/id/berita/"), jadi "/id" juga dibuang.
 */
export const stripLocale = (pathname: string) => pathname.replace(/^\/(en|id)(?=\/|$)/, "") || "/";

/**
 * Tambahkan prefiks bahasa ke tautan internal. Tidak diubah: tautan eksternal, jangkar,
 * media, dan path aplikasi donasi (/campaign, /donasi, /prog…) yang bukan bagian situs ini.
 */
export function localePath(href: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !href.startsWith("/") || href.startsWith("//")) return href;
  if (/^\/(en(\/|$)|wp-content\/|_next\/|api\/)/.test(href) || isDonationAppPath(href)) return href;
  return `/en${href}`;
}
