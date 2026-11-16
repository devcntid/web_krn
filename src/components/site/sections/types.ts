import type { Locale } from "@/i18n/config";

/** Konteks halaman yang diteruskan ke setiap renderer section. */
export type SectionContext = {
  /** Path halaman tanpa slash depan/belakang. */
  path: string;
  /** Judul halaman (dipakai hero bila judul section kosong). */
  title: string;
  locale: Locale;
  /** Query string permintaan (mis. ?tema= untuk grid laporan). */
  query: Readonly<Record<string, string | string[] | undefined>>;
};
