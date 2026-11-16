import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "./db";

/*
 * Konten beranda di `settings.home` (prompt B8): { id: HomeContent, en: HomeContent }.
 * `settings["home.draft"]` = salinan kerja dari /admin/beranda yang belum diterbitkan
 * (dipakai Pratinjau/Draft Mode). Sumber awal: src/content/home.ts lewat `npm run db:seed:home`.
 */

const text = z.string().trim();
const required = text.min(1, "Wajib diisi");
const isoOrNull = z.iso.datetime({ offset: true }).nullable().default(null);

const slide = z.object({
  id: required.max(64),
  /** Judul kampanye; menjadi teks alt gambar. Slide mobile boleh kosong (alt bawaan bernomor). */
  title: text.default(""),
  /** URL Blob atau path lama /wp-content/uploads/… */
  image: required,
  /** Tujuan klik; kosong = slide tanpa tautan. */
  href: text.default(""),
  /** Jadwal tayang (ISO). null = tanpa batas. */
  startsAt: isoOrNull,
  endsAt: isoOrNull,
});

const cta = z.object({ label: required, href: required });

export const homeContentSchema = z.object({
  heroSlidesDesktop: z.array(slide),
  heroSlidesMobile: z.array(slide),
  intro: z.object({ scrollIcon: required, eyebrow: required, heading: required, paragraphs: z.array(required) }),
  featuredVideo: z.object({ youtubeId: required.regex(/^[\w-]{6,20}$/, "ID video YouTube tidak sah"), title: required }),
  impactMap: z.object({
    image: z.object({ src: required, width: z.number().int().positive(), height: z.number().int().positive() }),
    alt: required,
    heading: required,
    iconSize: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
    stats: z.array(z.object({ value: required, label: required, icon: required })).min(1).max(8),
  }),
  pillars: z.object({
    heading: z.array(required).length(2),
    cta,
    items: z.array(z.object({ title: required, href: required, image: required, description: required })),
  }),
  publications: z.object({ heading: required, cta, count: z.number().int().min(1).max(12) }),
  testimonials: z.object({
    heading: required,
    description: text.default(""),
    items: z.array(
      z.object({ id: required.max(64), quote: required, name: required, role: text.default(""), photo: required, visible: z.boolean().default(true) }),
    ),
  }),
  reportCta: z.object({ heading: required, description: required, cta, background: required }),
});

export type HomeContent = z.infer<typeof homeContentSchema>;
export type HomeSlide = HomeContent["heroSlidesDesktop"][number];

export const homeSettingsSchema = z.object({ id: homeContentSchema, en: homeContentSchema });
export type HomeSettings = z.infer<typeof homeSettingsSchema>;

export const HOME_KEY = "home";
export const HOME_DRAFT_KEY = "home.draft";

/** Baca & validasi konten beranda dari tabel settings; null bila belum ada atau bentuknya tidak sah. */
export async function readHomeSettings(key: typeof HOME_KEY | typeof HOME_DRAFT_KEY): Promise<HomeSettings | null> {
  const [row] = await getDb().select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  if (!row) return null;
  const parsed = homeSettingsSchema.safeParse(row.value);
  if (!parsed.success) {
    console.error(`settings.${key} tidak sah:`, parsed.error.issues.slice(0, 5));
    return null;
  }
  return parsed.data;
}

/** Slide yang sedang dalam jadwal tayangnya. */
export function activeSlides(slides: readonly HomeSlide[], now: Date = new Date()): HomeSlide[] {
  const t = now.getTime();
  return slides.filter((s) => (!s.startsAt || new Date(s.startsAt).getTime() <= t) && (!s.endsAt || new Date(s.endsAt).getTime() > t));
}
