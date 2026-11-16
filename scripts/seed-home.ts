/**
 * Isi `settings.home` (konten beranda, prompt B8) dari src/content/home.ts + src/content/en/home.ts.
 *
 *   npm run db:seed:home            → tulis bila settings.home belum ada atau masih berbentuk lama
 *   npm run db:seed:home -- --dry   → hanya validasi
 *   npm run db:seed:home -- --force → timpa (MENGHAPUS perubahan dari /admin/beranda)
 */
import { loadEnvConfig } from "@next/env";

import * as homeEn from "@/content/en/home";
import * as homeId from "@/content/home";
import { getDb, schema } from "@/server/db";
import { HOME_KEY, type HomeSettings, homeSettingsSchema, readHomeSettings } from "@/server/home";

loadEnvConfig(process.cwd());

type Source = typeof homeId;

/** Bentuk settings.home dari modul konten satu bahasa. ID slide/testimoni sama di kedua bahasa. */
function fromContent(c: Source) {
  return {
    heroSlidesDesktop: c.heroSlidesDesktop.map((s, i) => ({ id: `d${i + 1}`, title: s.title, image: s.image, href: s.href, startsAt: null, endsAt: null })),
    // Slide mobile di situs asli tanpa judul dan tanpa tautan.
    heroSlidesMobile: c.heroSlidesMobile.map((image, i) => ({ id: `m${i + 1}`, title: "", image, href: "", startsAt: null, endsAt: null })),
    intro: c.intro,
    featuredVideo: c.featuredVideo,
    impactMap: c.impactMap,
    pillars: c.pillars,
    publications: c.publications,
    testimonials: { ...c.testimonials, items: c.testimonials.items.map((t, i) => ({ id: `t${i + 1}`, ...t, visible: true })) },
    reportCta: c.reportCta,
  };
}

export function buildHomeSettings(): HomeSettings {
  return homeSettingsSchema.parse({ id: fromContent(homeId), en: fromContent(homeEn as unknown as Source) });
}

async function main() {
  const dry = process.argv.includes("--dry");
  const force = process.argv.includes("--force");
  const value = buildHomeSettings();
  console.log(`✓ sah — ${value.id.heroSlidesDesktop.length} slide desktop, ${value.id.heroSlidesMobile.length} slide mobile, ${value.id.testimonials.items.length} testimoni`);
  if (dry) process.exit(0);

  if ((await readHomeSettings(HOME_KEY)) && !force) {
    console.log("– settings.home sudah berbentuk baru, dilewati (pakai --force untuk menimpa)");
    process.exit(0);
  }
  await getDb().insert(schema.settings).values({ key: HOME_KEY, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  console.log("✓ settings.home ditulis");
  process.exit(0);
}

// Hanya dijalankan sebagai skrip (modul ini juga diimpor scripts/seed-from-export.ts).
if (process.argv[1]?.endsWith("seed-home.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
