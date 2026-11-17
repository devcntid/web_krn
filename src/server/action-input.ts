import "server-only";

import { z } from "zod";

import { PAGE_TEMPLATES } from "./sections";

/**
 * Skema Zod di batas Server Action (B16). Server Action bisa dipanggil siapa saja dengan argumen
 * apa pun — tipe TypeScript tidak berlaku saat runtime. Skema ini memeriksa BENTUK & batas ukuran;
 * aturan bisnis (slug unik, hak akses per post, isi section, dsb.) tetap di service masing-masing.
 */

export type InputResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): InputResult<T> {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  const issue = r.error.issues[0];
  const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  return { ok: false, error: `Data tidak sah — ${where}${issue?.message ?? "bentuk salah"}` };
}

const str = (max: number) => z.string().max(max);
const id = z.number().int().positive();
const ids = z.array(id).max(200);
const uuid = z.string().uuid();
const jsonObject = z.record(z.string(), z.unknown());

export const savePostSchema = z.object({
  id: id.nullable(),
  intent: z.enum(["autosave", "save", "review", "publish", "schedule", "draft"]),
  title: str(300),
  slug: str(200),
  slugAuto: z.boolean(),
  excerpt: str(2000),
  // Batas ~2 MB HTML; JSON Tiptap tidak diperiksa isinya (HTML-lah yang disanitasi & disimpan).
  content: z.object({ json: z.unknown(), html: str(2_000_000) }).optional(),
  categoryIds: ids,
  tagIds: ids,
  newTags: z.array(str(80)).max(50),
  featuredMediaId: id.nullable(),
  featuredAlt: str(300).optional(),
  seoTitle: str(300),
  seoDescription: str(500),
  canonical: str(500),
  authorId: uuid.nullable(),
  reviewerId: uuid.nullable(),
  publishAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "format tanggal")
    .nullable(),
});

export const savePageSchema = z.object({
  id,
  title: str(300),
  status: z.enum(["draft", "published"]),
  template: z.enum(PAGE_TEMPLATES),
  seoTitle: str(300),
  seoDescription: str(500),
  sections: z
    .array(z.object({ id: str(80), type: str(60), visible: z.boolean(), data: jsonObject, en: jsonObject.optional() }))
    .max(100),
});

export const createPageSchema = z.object({ title: str(300), slug: str(200), parentPath: str(300) });

export const termSchema = z.object({ name: str(200), slug: str(200), parentId: id.nullable(), description: str(2000) });

export const redirectSchema = z.object({ source: str(500), destination: str(1000), statusCode: z.number().int(), note: str(300) });

export const mediaMetaSchema = z.object({ alt: str(500), caption: str(2000) });

export const reportSchema = z.object({
  title: str(300),
  year: z.number().int().min(1990).max(2100),
  themes: z.array(str(80)).max(20),
  url: str(1000),
  coverMediaId: id.nullable(),
  visible: z.boolean(),
});

export const auditSchema = z.object({ year: z.number().int().min(1990).max(2100), opinion: str(300), documentUrl: str(1000), pdfMediaId: id.nullable() });

export const legalSchema = z.object({ kind: str(200), text: str(2000), kindEn: str(200), textEn: str(2000) });

const slide = z.object({}).passthrough();
export const homeEditorSchema = z.object({
  slidesDesktop: z.array(slide).max(30),
  slidesMobile: z.array(slide).max(30),
  mapHeading: str(300),
  mapHeadingEn: str(300),
  stats: z.array(z.object({}).passthrough()).max(20),
  videoUrl: str(500),
  videoTitle: str(300),
  videoTitleEn: str(300),
  testimonials: z.array(z.object({}).passthrough()).max(50),
});
