import { z } from "zod";

/**
 * Bentuk pengaturan situs (/admin/pengaturan). Disimpan per kunci di tabel `settings`:
 * identity, contact, socials, menu, integrations. Dipakai server (validasi) dan form admin.
 */

export const SOCIAL_PLATFORMS = ["Instagram", "Facebook", "YouTube", "Threads", "LinkedIn", "TikTok"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const text = (max: number) => z.string().trim().max(max);
const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https:\/\/[^\s]+$/i.test(v), "Harus URL https://");
/** Tautan internal ("/…") atau https://. Kosong tidak boleh. */
const link = z
  .string()
  .trim()
  .min(1, "Tautan wajib diisi")
  .max(500)
  .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(v), "Gunakan path internal (/…) atau URL https://");
/** Gambar: path lama /wp-content/uploads/… atau URL Blob https://. */
const imageSrc = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/wp-content/uploads/") || /^https:\/\/[^\s]+$/i.test(v), "Gambar harus dari pustaka media");

/** Judul tab browser pada beranda. Nilai lama di database belum punya kolom ini. */
export const DEFAULT_DOCUMENT_TITLE = "Relawan Nusantara - Jembatan Kebaikan untuk Kemanusiaan";

export const identitySchema = z.object({
  name: text(80).min(1, "Nama situs wajib diisi"),
  documentTitle: text(120).min(1, "Judul tab browser wajib diisi").default(DEFAULT_DOCUMENT_TITLE),
  tagline: text(200),
  logo: z.object({
    src: imageSrc.refine((v) => v !== "", "Logo wajib dipilih"),
    width: z.number().int().positive().max(5000),
    height: z.number().int().positive().max(5000),
  }),
  favicon: imageSrc,
});

export const contactSchema = z.object({
  /** Nomor WhatsApp format internasional tanpa "+" (mis. 6285…). */
  whatsapp: z
    .string()
    .trim()
    .regex(/^[1-9]\d{7,14}$/, "Nomor WhatsApp: angka saja, diawali kode negara (mis. 6285…)"),
  phoneDisplay: text(60).min(1, "Teks nomor wajib diisi"),
  email: z.email("Email tidak sah").max(120),
  address: text(300).min(1, "Alamat wajib diisi"),
});

export const socialsSchema = z
  .array(z.object({ platform: z.enum(SOCIAL_PLATFORMS), href: httpsUrl }))
  .max(SOCIAL_PLATFORMS.length)
  .refine((list) => new Set(list.map((s) => s.platform)).size === list.length, "Setiap platform hanya boleh sekali");

const menuChild = z.object({ label: text(60).min(1, "Label menu wajib diisi"), labelEn: text(60), href: link });

export const menuSchema = z
  .array(
    z
      .object({
        label: text(60).min(1, "Label menu wajib diisi"),
        labelEn: text(60),
        /** Kosong untuk grup dropdown (punya sub-menu). */
        href: z.string().trim().max(500),
        children: z.array(menuChild).max(12),
      })
      .superRefine((item, ctx) => {
        if (item.children.length) return;
        const r = link.safeParse(item.href);
        if (!r.success) ctx.addIssue({ code: "custom", path: ["href"], message: `${item.label}: ${r.error.issues[0]?.message ?? "tautan tidak sah"}` });
      }),
  )
  .min(1, "Menu tidak boleh kosong")
  .max(10, "Maksimal 10 menu utama");

/** Path halaman yang tampil di `/`. `new-beranda` = beranda otomatis (slider, pilar, testimoni). */
export const BUILTIN_FRONT_PAGE = "new-beranda";

export const CODE_KINDS = ["css", "javascript", "html"] as const;

/** Satu potongan kode. Centang header, body, dan/atau footer menentukan tempat pemasangan. */
export const customCodeSchema = z.object({
  snippets: z
    .array(
      z
        .object({
          id: z
            .string()
            .trim()
            .min(1)
            .max(40)
            .regex(/^[a-zA-Z0-9_-]+$/, "ID kode tidak sah"),
          kind: z.enum(CODE_KINDS),
          code: z.string().max(20_000, "Kode terlalu panjang (maksimal 20.000 karakter)"),
          header: z.boolean(),
          body: z.boolean(),
          footer: z.boolean(),
        })
        .superRefine((item, ctx) => {
          if (!item.code.trim()) return;
          if (!item.header && !item.body && !item.footer) ctx.addIssue({ code: "custom", message: "Pilih header, body, atau footer" });
        }),
    )
    .max(12, "Maksimal 12 kode"),
});

export const readingSchema = z.object({
  frontPage: z
    .string()
    .trim()
    .min(1, "Halaman depan wajib dipilih")
    .max(200)
    .regex(/^[a-z0-9]+(?:[/_-][a-z0-9]+)*$/, "Halaman depan tidak sah"),
});

export const integrationsSchema = z.object({
  ga4Id: z
    .string()
    .trim()
    .regex(/^(G-[A-Z0-9]{4,15})?$/, "ID GA4 berbentuk G-XXXXXXX"),
  metaPixelId: z
    .string()
    .trim()
    .regex(/^(\d{10,20})?$/, "ID Meta Pixel berupa 10–20 angka"),
  donateUrl: link,
  showSaffa: z.boolean(),
  maintenance: z.boolean(),
});

export const siteSettingsSchema = z.object({
  identity: identitySchema,
  contact: contactSchema,
  socials: socialsSchema,
  menu: menuSchema,
  integrations: integrationsSchema,
  reading: readingSchema,
  codes: customCodeSchema,
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type SiteSettingsKey = keyof SiteSettings;
export type MenuItem = SiteSettings["menu"][number];
export const SITE_SETTINGS_KEYS = Object.keys(siteSettingsSchema.shape) as SiteSettingsKey[];

/** URL WhatsApp dari nomor di pengaturan. */
export const whatsappHref = (number: string) => `https://api.whatsapp.com/send?phone=${number}`;

/** Data yang dibutuhkan komponen client publik (Header, MobileMenu). */
export type PublicShellSettings = {
  name: string;
  logo: SiteSettings["identity"]["logo"];
  menu: MenuItem[];
  donateUrl: string;
  saffa: { href: string; show: boolean };
};

/** Label menu sesuai bahasa: Inggris memakai labelEn, lalu kamus i18n (label lama), lalu label asli. */
export function menuLabel(item: { label: string; labelEn: string }, locale: string, nav: Record<string, string>): string {
  if (locale !== "en") return item.label;
  return item.labelEn || nav[item.label] || item.label;
}
