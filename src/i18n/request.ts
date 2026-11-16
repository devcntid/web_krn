import "server-only";

import { cache } from "react";

import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Bahasa untuk render server saat ini. Disimpan per-request lewat React `cache`,
 * diisi oleh layout dan setiap halaman dari segmen URL [lang] (lihat `initLocale`).
 * Komponen server cukup memanggil `getLocale()` tanpa menerima prop.
 */
const store = cache((): { locale: Locale } => ({ locale: DEFAULT_LOCALE }));

export function getLocale(): Locale {
  return store().locale;
}

/** Dipanggil di awal layout, halaman, dan generateMetadata: `const locale = await initLocale(params)`. */
export async function initLocale(params: Promise<Record<string, string | string[] | undefined>>): Promise<Locale> {
  const { lang } = await params;
  if (Array.isArray(lang)) return DEFAULT_LOCALE;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  store().locale = locale;
  return locale;
}
