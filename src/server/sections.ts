import "server-only";

import { z } from "zod";

import { parseVisualNodes } from "@/lib/visual-page";

/*
 * Tipe section halaman (kolom `pages.sections`) — divalidasi Zod saat disimpan dari admin
 * dan saat dibaca untuk dirender. Renderer publik: src/components/site/sections/*;
 * deskripsi field untuk form admin: src/lib/section-fields.ts (harus sejalan dengan skema di sini —
 * dicek oleh scripts/check-sections.ts).
 *
 * Sembilan keluarga (Hero, Teks 2 kolom, Kartu, Grid publikasi, Testimoni, Accordion, Logo mitra,
 * CTA, Richtext) dipecah menjadi beberapa varian karena tiap halaman hasil rekonstruksi punya
 * tata letak sendiri yang harus tetap sama persis.
 */

const text = z.string().trim();
const required = text.min(1, "Wajib diisi");
const href = text.min(1, "Wajib diisi").max(2000);

export const mediaRefSchema = z.object({
  /** URL Blob atau path lama /wp-content/uploads/… */
  src: required,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: text.default(""),
});

const dataSchemas = {
  /* ---------- Hero ---------- */
  hero: z.object({
    /** Kosong = memakai judul halaman. */
    title: text.default(""),
    eyebrow: text.default(""),
    subtitle: text.default(""),
    image: mediaRefSchema.nullable().default(null),
    size: z.enum(["page", "medium", "compact", "small"]).default("page"),
    overlay: z.number().min(0).max(0.9).default(0.4),
  }),

  /* ---------- Teks 2 kolom ---------- */
  "text-tagline": z.object({ heading: required, body: required }),
  "text-embed": z.object({
    headingLead: text.default(""),
    headingStrong: required,
    body: required,
    embedSrc: href,
    embedTitle: required,
  }),
  "text-vision": z.object({
    visionHeading: required,
    visionLines: z.array(required).min(1).max(4),
    missionHeading: required,
    missionItems: z.array(required).min(1),
  }),
  "text-alternating": z.object({
    heading: required,
    items: z.array(z.object({ title: required, paragraphs: z.array(required).min(1), image: mediaRefSchema })).min(1),
  }),
  "text-list-image": z.object({
    heading: required,
    items: z.array(z.object({ title: required, description: required })).min(1),
    image: mediaRefSchema,
  }),

  /* ---------- Kartu ---------- */
  "cards-stats": z.object({ items: z.array(z.object({ title: required, description: required })).min(1) }),
  "cards-programs": z.object({
    heading: required,
    items: z.array(z.object({ title: required, description: required, image: mediaRefSchema })).min(1),
  }),
  "cards-pillars": z.object({
    headingLines: z.array(required).min(1).max(3),
    linkLabel: required,
    items: z.array(z.object({ title: required, description: required, image: mediaRefSchema, href })).min(1),
  }),
  "cards-links": z.object({
    heading: required,
    description: text.default(""),
    items: z.array(z.object({ title: required, href, description: required, cta: required })).min(1),
  }),
  "cards-steps": z.object({
    heading: required,
    items: z.array(z.object({ title: required, icon: mediaRefSchema, description: required })).min(1),
  }),
  "cards-docs": z.object({
    intro: text.default(""),
    items: z.array(z.object({ kind: required, text: required })).min(1),
  }),

  /* ---------- Grid publikasi ---------- */
  posts: z.object({
    /** Kosong = "Cerita Berdampak" (kamus antarmuka). */
    heading: text.default(""),
    /** Label carousel untuk pembaca layar. */
    label: required,
    /** Slug kategori sumber; kosong = publikasi terbaru. */
    categories: z.array(required).default([]),
    count: z.number().int().min(1).max(12).default(6),
    /** Bila hasil kategori kurang dari ini, dilengkapi publikasi terbaru (0 = tidak dilengkapi). */
    fillMin: z.number().int().min(0).max(12).default(0),
    /** Tujuan tombol "Lihat Semua Cerita". */
    href,
    showExcerpt: z.boolean().default(false),
  }),

  /* ---------- Testimoni ---------- */
  testimonials: z.object({
    heading: required,
    description: text.default(""),
    /** Kosong = memakai daftar testimoni beranda. */
    items: z.array(z.object({ quote: required, name: required, role: text.default(""), photo: mediaRefSchema })).default([]),
  }),

  /* ---------- Accordion ---------- */
  "accordion-docs": z.object({
    headingLines: z.array(required).min(1).max(3),
    paragraphs: z.array(required).default([]),
    badge: text.default(""),
    items: z.array(z.object({ title: required, previewUrl: href, pdfUrl: href })).min(1),
  }),
  accordion: z.object({
    heading: text.default(""),
    items: z.array(z.object({ title: required, body: required })).min(1),
  }),

  /* ---------- Logo mitra ---------- */
  logos: z.object({
    heading: required,
    description: text.default(""),
    /** Label daftar logo untuk pembaca layar. */
    label: required,
    items: z.array(z.object({ name: required, image: mediaRefSchema })).min(1),
  }),

  /* ---------- CTA ---------- */
  "cta-banner": z.object({ heading: required, description: text.default(""), label: required, href }),
  "cta-cards": z.object({
    heading: required,
    description: text.default(""),
    cards: z.array(z.object({ label: required, href, image: mediaRefSchema, external: z.boolean().default(false) })).min(1),
  }),
  "cta-contact": z.object({
    heading: required,
    description: text.default(""),
    buttonLabel: required,
    phoneLabel: required,
    phoneDisplay: required,
    phoneHref: href,
    emailLabel: required,
    emailDisplay: required,
    emailHref: href,
    mapSrc: href,
    mapTitle: required,
  }),

  /* ---------- Grid laporan (e-Report) ---------- */
  reports: z.object({
    themes: z.array(z.object({ slug: required.regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung"), label: required })).default([]),
    items: z
      .array(
        z.object({
          year: z.number().int().min(2000).max(2100),
          title: required,
          url: href,
          cover: mediaRefSchema,
          themes: z.array(required).default([]),
        }),
      )
      .min(1),
  }),

  /* ---------- Daftar dari tabel (dikelola di /admin/laporan) ---------- */
  /** Grid laporan e-Report: butir dari tabel `reports`; section hanya menyimpan label tema. */
  "reports-db": z.object({
    themes: z.array(z.object({ slug: required.regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung"), label: required })).default([]),
  }),
  /** Pengantar + accordion audit: butir dari tabel `audits`. */
  "audits-db": z.object({ headingLines: z.array(required).min(1).max(3), paragraphs: z.array(required).default([]), badge: text.default("") }),
  /** Pengantar + daftar dokumen legalitas: butir dari tabel `legal_docs`. */
  "legal-db": z.object({ intro: text.default("") }),

  /* ---------- Richtext ---------- */
  richtext: z.object({ html: z.string() }),

  /**
   * Pohon Visual Builder. Halaman klasik tidak memakai tipe ini.
   * `nodes` dinormalisasi di transform; isi yang tidak sah gagal disimpan.
   */
  visual: z
    .object({ nodes: z.array(z.unknown()).max(80) })
    .superRefine((value, ctx) => {
      for (const issue of parseVisualNodes(value.nodes).issues) {
        ctx.addIssue({ code: "custom", message: issue.message, path: ["nodes", ...issue.path] });
      }
    })
    .transform((value) => ({ nodes: parseVisualNodes(value.nodes).nodes })),
} as const;

export type SectionType = keyof typeof dataSchemas;
export const SECTION_TYPES = Object.keys(dataSchemas) as SectionType[];

export type SectionData<T extends SectionType = SectionType> = z.infer<(typeof dataSchemas)[T]>;
export type MediaRefData = z.infer<typeof mediaRefSchema>;

/** Satu section tersimpan. `en` = isi versi Inggris (struktur sama); tanpa `en`, versi Inggris memakai isi Indonesia. */
export type Section<T extends SectionType = SectionType> = {
  [K in T]: { id: string; type: K; visible: boolean; data: SectionData<K>; en?: SectionData<K> };
}[T];

export function isSectionType(value: unknown): value is SectionType {
  return typeof value === "string" && value in dataSchemas;
}

export function sectionDataSchema(type: SectionType): z.ZodType {
  return dataSchemas[type];
}

const envelope = z.object({
  id: z.string().min(1).max(64),
  type: z.string(),
  visible: z.boolean().default(true),
  data: z.unknown(),
  en: z.unknown().optional(),
});

export type SectionIssue = { index: number; type: string; locale: "id" | "en"; path: string; message: string };

/**
 * Validasi daftar section. Section bertipe tak dikenal atau berisi data tidak sah dilaporkan
 * di `issues` dan TIDAK ikut di `sections`.
 */
export function parseSections(raw: unknown): { sections: Section[]; issues: SectionIssue[] } {
  const sections: Section[] = [];
  const issues: SectionIssue[] = [];
  if (!Array.isArray(raw)) return { sections, issues };

  raw.forEach((item, index) => {
    // Section lama hasil seed tidak punya id → diberi id stabil berdasarkan urutan.
    const withId = typeof item === "object" && item !== null && !("id" in item) ? { ...item, id: `s${index + 1}` } : item;
    const env = envelope.safeParse(withId);
    if (!env.success) {
      issues.push({ index, type: "?", locale: "id", path: "", message: "Bentuk section tidak dikenali" });
      return;
    }
    const { id, type, visible } = env.data;
    if (!isSectionType(type)) {
      issues.push({ index, type, locale: "id", path: "type", message: `Tipe section "${type}" tidak dikenal` });
      return;
    }
    const schema = dataSchemas[type];
    const data = schema.safeParse(env.data.data);
    if (!data.success) {
      for (const issue of data.error.issues) issues.push({ index, type, locale: "id", path: issue.path.join("."), message: issue.message });
      return;
    }
    let en: unknown;
    if (env.data.en !== undefined && env.data.en !== null) {
      const parsed = schema.safeParse(env.data.en);
      if (parsed.success) en = parsed.data;
      else for (const issue of parsed.error.issues) issues.push({ index, type, locale: "en", path: issue.path.join("."), message: issue.message });
    }
    sections.push({ id, type, visible, data: data.data, ...(en === undefined ? {} : { en }) } as Section);
  });
  return { sections, issues };
}

/** Isi section untuk bahasa tertentu (Inggris jatuh ke Indonesia bila belum diterjemahkan). */
export function localizedData<T extends SectionType>(section: Section<T>, locale: string): SectionData<T> {
  return locale === "en" && section.en ? section.en : section.data;
}

/** Template halaman: generic = hero kecil + HTML (halaman WordPress lama); sections = disusun dari section. */
export const PAGE_TEMPLATES = ["generic", "sections", "sections-muted"] as const;
export type PageTemplate = (typeof PAGE_TEMPLATES)[number];

export function isSectionTemplate(template: string): boolean {
  return template === "sections" || template === "sections-muted";
}
