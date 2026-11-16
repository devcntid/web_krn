import "server-only";

import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { cache } from "react";

import type { Locale } from "@/i18n/config";
import { CACHE_TAGS } from "@/lib/content";
import { HOME_DRAFT_KEY, HOME_KEY, type HomeContent, readHomeSettings } from "@/server/home";
import { getCurrentUser } from "@/server/permissions";

const published = cache(
  unstable_cache(() => readHomeSettings(HOME_KEY), ["settings:home:v2"], { tags: [CACHE_TAGS.settings] }),
);

/** Dalam Draft Mode (pratinjau admin): salinan kerja beranda yang belum diterbitkan, bila ada. */
const draft = cache(async () => {
  if (!(await draftMode()).isEnabled) return null;
  if (!(await getCurrentUser())) return null;
  return readHomeSettings(HOME_DRAFT_KEY);
});

/** Benar bila halaman ini sedang menampilkan pratinjau beranda (Draft Mode + admin masuk). */
export async function isHomePreview(): Promise<boolean> {
  return (await draftMode()).isEnabled && (await getCurrentUser()) !== null;
}

/**
 * Konten beranda untuk bahasa tertentu, dari `settings.home` (dikelola di /admin/beranda).
 * Cache bertag `settings`; disegarkan oleh "Terbitkan Perubahan".
 */
export async function getHomeContent(locale: Locale): Promise<HomeContent> {
  const data = (await draft()) ?? (await published());
  if (!data) throw new Error("settings.home belum ada atau tidak sah — jalankan `npm run db:seed:home`.");
  return data[locale];
}
