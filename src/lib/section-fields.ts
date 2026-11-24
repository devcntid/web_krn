import type { SectionType } from "@/server/sections";

/*
 * Deskripsi field tiap tipe section untuk form admin (/admin/halaman). Aman dipakai di klien
 * (hanya mengimpor TIPE dari src/server/sections.ts). Validasi sebenarnya dilakukan Zod di server;
 * kesesuaian daftar field di sini dengan skema dicek oleh `npx tsx scripts/check-sections.ts`.
 */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

type Base = { name: string; label: string; help?: string };

export type Field =
  | (Base & { kind: "text" | "textarea" | "url" | "html"; optional?: boolean })
  | (Base & { kind: "number"; min?: number; max?: number; step?: number; initial?: number })
  | (Base & { kind: "select"; options: readonly { value: string; label: string }[] })
  | (Base & { kind: "boolean" })
  | (Base & { kind: "image"; optional?: boolean })
  | (Base & { kind: "strings"; itemLabel: string; multiline?: boolean })
  | (Base & { kind: "categories" })
  | (Base & { kind: "list"; itemLabel: string; titleField?: string; fields: readonly Field[] });

export type SectionDef = {
  type: SectionType;
  /** Keluarga section di menu "Tambah section". */
  family: string;
  label: string;
  description: string;
  fields: readonly Field[];
};

const title: Field = { kind: "text", name: "title", label: "Judul" };
const description: Field = { kind: "textarea", name: "description", label: "Deskripsi" };
const image: Field = { kind: "image", name: "image", label: "Gambar" };

export const SECTION_DEFS: readonly SectionDef[] = [
  {
    type: "hero",
    family: "Hero",
    label: "Hero",
    description: "Gambar latar dengan judul halaman (H1).",
    fields: [
      { kind: "text", name: "title", label: "Judul", optional: true, help: "Kosongkan untuk memakai judul halaman." },
      { kind: "text", name: "eyebrow", label: "Label kecil di atas judul", optional: true },
      { kind: "textarea", name: "subtitle", label: "Teks di bawah judul", optional: true },
      { kind: "image", name: "image", label: "Gambar latar", optional: true },
      {
        kind: "select",
        name: "size",
        label: "Tinggi",
        options: [
          { value: "page", label: "Penuh (707px)" },
          { value: "medium", label: "Sedang (600px)" },
          { value: "compact", label: "Ringkas (520px)" },
          { value: "small", label: "Kecil (480px)" },
        ],
      },
      { kind: "number", name: "overlay", label: "Gelap lapisan (0–0,9)", min: 0, max: 0.9, step: 0.05, initial: 0.4 },
    ],
  },
  {
    type: "text-tagline",
    family: "Teks 2 kolom",
    label: "Tagline + paragraf",
    description: "Tagline besar di kiri, paragraf di kanan.",
    fields: [
      { kind: "text", name: "heading", label: "Tagline" },
      { kind: "textarea", name: "body", label: "Paragraf" },
    ],
  },
  {
    type: "text-embed",
    family: "Teks 2 kolom",
    label: "Teks + sematan",
    description: "Judul dan paragraf di kiri, flipbook/iframe di kanan.",
    fields: [
      { kind: "text", name: "headingLead", label: "Judul (bagian tipis)", optional: true },
      { kind: "text", name: "headingStrong", label: "Judul (bagian tebal)" },
      { kind: "textarea", name: "body", label: "Paragraf" },
      { kind: "url", name: "embedSrc", label: "URL sematan (https://…)" },
      { kind: "text", name: "embedTitle", label: "Judul sematan (untuk pembaca layar)" },
    ],
  },
  {
    type: "text-vision",
    family: "Teks 2 kolom",
    label: "Visi & Misi",
    description: "Kartu visi hijau dan daftar misi bernomor.",
    fields: [
      { kind: "text", name: "visionHeading", label: "Judul visi" },
      { kind: "strings", name: "visionLines", label: "Baris visi", itemLabel: "baris" },
      { kind: "text", name: "missionHeading", label: "Judul misi" },
      { kind: "strings", name: "missionItems", label: "Butir misi", itemLabel: "butir", multiline: true },
    ],
  },
  {
    type: "text-alternating",
    family: "Teks 2 kolom",
    label: "Baris gambar + teks",
    description: "Baris gambar dan teks berselang-seling kiri-kanan.",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian" },
      {
        kind: "list",
        name: "items",
        label: "Baris",
        itemLabel: "baris",
        titleField: "title",
        fields: [title, { kind: "strings", name: "paragraphs", label: "Paragraf", itemLabel: "paragraf", multiline: true }, image],
      },
    ],
  },
  {
    type: "text-list-image",
    family: "Teks 2 kolom",
    label: "Daftar + gambar",
    description: "Judul dan kartu butir di kiri, gambar di kanan.",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian" },
      { kind: "list", name: "items", label: "Butir", itemLabel: "butir", titleField: "title", fields: [title, description] },
      image,
    ],
  },
  {
    type: "cards-stats",
    family: "Kartu program",
    label: "Angka ringkas",
    description: "Deretan kartu angka/capaian.",
    fields: [{ kind: "list", name: "items", label: "Kartu", itemLabel: "kartu", titleField: "title", fields: [title, description] }],
  },
  {
    type: "cards-programs",
    family: "Kartu program",
    label: "Kartu program",
    description: "Kartu program: gambar kecil, judul, dan deskripsi.",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian" },
      { kind: "list", name: "items", label: "Program", itemLabel: "program", titleField: "title", fields: [title, description, image] },
    ],
  },
  {
    type: "cards-pillars",
    family: "Kartu program",
    label: "Kartu bergambar + tautan",
    description: "Kartu besar bergambar dengan tautan ke halaman lain.",
    fields: [
      { kind: "strings", name: "headingLines", label: "Judul bagian (per baris)", itemLabel: "baris" },
      { kind: "text", name: "linkLabel", label: "Teks tautan" },
      {
        kind: "list",
        name: "items",
        label: "Kartu",
        itemLabel: "kartu",
        titleField: "title",
        fields: [title, description, image, { kind: "url", name: "href", label: "Tujuan tautan (/path/ atau https://…)" }],
      },
    ],
  },
  {
    type: "cards-links",
    family: "Kartu program",
    label: "Kartu tautan",
    description: "Kartu bergaris berisi judul, deskripsi, dan ajakan.",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian" },
      { kind: "textarea", name: "description", label: "Deskripsi", optional: true },
      {
        kind: "list",
        name: "items",
        label: "Kartu",
        itemLabel: "kartu",
        titleField: "title",
        fields: [title, { kind: "url", name: "href", label: "Tujuan tautan" }, description, { kind: "text", name: "cta", label: "Teks ajakan" }],
      },
    ],
  },
  {
    type: "cards-steps",
    family: "Kartu program",
    label: "Langkah berikon",
    description: "Langkah-langkah dengan ikon di tengah.",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian" },
      { kind: "list", name: "items", label: "Langkah", itemLabel: "langkah", titleField: "title", fields: [title, { kind: "image", name: "icon", label: "Ikon" }, description] },
    ],
  },
  {
    type: "cards-docs",
    family: "Kartu program",
    label: "Daftar dokumen",
    description: "Paragraf pengantar dan daftar dokumen berikon.",
    fields: [
      { kind: "textarea", name: "intro", label: "Pengantar", optional: true },
      {
        kind: "list",
        name: "items",
        label: "Dokumen",
        itemLabel: "dokumen",
        titleField: "kind",
        fields: [
          { kind: "text", name: "kind", label: "Jenis dokumen" },
          { kind: "textarea", name: "text", label: "Teks dokumen" },
        ],
      },
    ],
  },
  {
    type: "posts",
    family: "Grid publikasi",
    label: "Grid publikasi",
    description: "Carousel publikasi otomatis dari kategori terpilih.",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian", optional: true, help: "Kosongkan untuk “Cerita Berdampak”." },
      { kind: "text", name: "label", label: "Label carousel (untuk pembaca layar)" },
      { kind: "categories", name: "categories", label: "Sumber: kategori", help: "Kosongkan untuk publikasi terbaru dari semua kategori." },
      { kind: "number", name: "count", label: "Jumlah publikasi", min: 1, max: 12, step: 1, initial: 6 },
      { kind: "number", name: "fillMin", label: "Lengkapi dengan publikasi terbaru bila kurang dari", min: 0, max: 12, step: 1, initial: 0, help: "0 = tidak dilengkapi." },
      { kind: "url", name: "href", label: "Tujuan tombol “Lihat Semua Cerita”" },
      { kind: "boolean", name: "showExcerpt", label: "Tampilkan ringkasan di kartu" },
    ],
  },
  {
    type: "testimonials",
    family: "Testimoni",
    label: "Testimoni",
    description: "Carousel kutipan dengan foto, nama, dan peran.",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian" },
      { kind: "textarea", name: "description", label: "Deskripsi", optional: true },
      {
        kind: "list",
        name: "items",
        label: "Testimoni",
        itemLabel: "testimoni",
        titleField: "name",
        help: "Kosongkan untuk memakai daftar testimoni beranda.",
        fields: [
          { kind: "textarea", name: "quote", label: "Kutipan" },
          { kind: "text", name: "name", label: "Nama" },
          { kind: "text", name: "role", label: "Peran", optional: true },
          { kind: "image", name: "photo", label: "Foto" },
        ],
      },
    ],
  },
  {
    type: "accordion-docs",
    family: "Accordion",
    label: "Accordion dokumen",
    description: "Teks pengantar di kiri, accordion dokumen tersemat (PDF) di kanan.",
    fields: [
      { kind: "strings", name: "headingLines", label: "Judul (per baris)", itemLabel: "baris" },
      { kind: "strings", name: "paragraphs", label: "Paragraf", itemLabel: "paragraf", multiline: true },
      { kind: "text", name: "badge", label: "Lencana", optional: true },
      {
        kind: "list",
        name: "items",
        label: "Dokumen",
        itemLabel: "dokumen",
        titleField: "title",
        fields: [title, { kind: "url", name: "previewUrl", label: "URL pratinjau tersemat (https://…)" }, { kind: "url", name: "pdfUrl", label: "URL tombol “Lihat PDF”" }],
      },
    ],
  },
  {
    type: "accordion",
    family: "Accordion",
    label: "Accordion teks",
    description: "Daftar judul yang bisa dibuka-tutup (mis. tanya-jawab).",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian", optional: true },
      { kind: "list", name: "items", label: "Butir", itemLabel: "butir", titleField: "title", fields: [title, { kind: "html", name: "body", label: "Isi (HTML sederhana)" }] },
    ],
  },
  {
    type: "logos",
    family: "Logo mitra",
    label: "Logo mitra",
    description: "Deretan logo yang berjalan otomatis.",
    fields: [
      { kind: "text", name: "heading", label: "Judul bagian" },
      { kind: "textarea", name: "description", label: "Deskripsi", optional: true },
      { kind: "text", name: "label", label: "Label daftar logo (untuk pembaca layar)" },
      { kind: "list", name: "items", label: "Logo", itemLabel: "logo", titleField: "name", fields: [{ kind: "text", name: "name", label: "Nama mitra" }, { kind: "image", name: "image", label: "Logo" }] },
    ],
  },
  {
    type: "cta-banner",
    family: "CTA",
    label: "Banner + tombol",
    description: "Banner hijau dengan satu tombol ajakan.",
    fields: [
      { kind: "text", name: "heading", label: "Judul" },
      { kind: "textarea", name: "description", label: "Deskripsi", optional: true },
      { kind: "text", name: "label", label: "Teks tombol" },
      { kind: "url", name: "href", label: "Tujuan tombol" },
    ],
  },
  {
    type: "cta-cards",
    family: "CTA",
    label: "Kartu bergambar + tombol",
    description: "Judul dengan kartu bergambar, masing-masing bertombol.",
    fields: [
      { kind: "text", name: "heading", label: "Judul" },
      { kind: "textarea", name: "description", label: "Deskripsi", optional: true },
      {
        kind: "list",
        name: "cards",
        label: "Kartu",
        itemLabel: "kartu",
        titleField: "label",
        fields: [
          { kind: "text", name: "label", label: "Teks tombol" },
          { kind: "url", name: "href", label: "Tujuan tombol" },
          image,
          { kind: "boolean", name: "external", label: "Tujuan di luar situs ini (mis. /donasi)" },
        ],
      },
    ],
  },
  {
    type: "cta-contact",
    family: "CTA",
    label: "Kontak + peta",
    description: "Ajakan dengan telepon, email, tombol, dan peta tersemat.",
    fields: [
      { kind: "text", name: "heading", label: "Judul" },
      { kind: "textarea", name: "description", label: "Deskripsi", optional: true },
      { kind: "text", name: "buttonLabel", label: "Teks tombol (menuju email)" },
      { kind: "text", name: "phoneLabel", label: "Label telepon" },
      { kind: "text", name: "phoneDisplay", label: "Nomor telepon (tampilan)" },
      { kind: "url", name: "phoneHref", label: "Tautan telepon (tel:+62…)" },
      { kind: "text", name: "emailLabel", label: "Label email" },
      { kind: "text", name: "emailDisplay", label: "Alamat email (tampilan)" },
      { kind: "url", name: "emailHref", label: "Tautan email (mailto:…)" },
      { kind: "url", name: "mapSrc", label: "URL sematan Google Maps (https://…)" },
      { kind: "text", name: "mapTitle", label: "Judul peta (untuk pembaca layar)" },
    ],
  },
  {
    type: "reports",
    family: "Grid laporan",
    label: "Grid laporan (e-Report)",
    description: "Kartu laporan per tahun dengan filter tema.",
    fields: [
      {
        kind: "list",
        name: "themes",
        label: "Tema filter",
        itemLabel: "tema",
        titleField: "label",
        fields: [
          { kind: "text", name: "slug", label: "Slug (huruf kecil-dengan-tanda-hubung)" },
          { kind: "text", name: "label", label: "Label" },
        ],
      },
      {
        kind: "list",
        name: "items",
        label: "Laporan",
        itemLabel: "laporan",
        titleField: "title",
        fields: [
          { kind: "number", name: "year", label: "Tahun", min: 2000, max: 2100, step: 1, initial: new Date().getFullYear() },
          title,
          { kind: "url", name: "url", label: "URL flipbook/PDF" },
          { kind: "image", name: "cover", label: "Sampul" },
          { kind: "strings", name: "themes", label: "Tema (slug)", itemLabel: "tema" },
        ],
      },
    ],
  },
  {
    type: "reports-db",
    family: "Transparansi",
    label: "Daftar e-Report (otomatis)",
    description: "Kartu laporan dari menu e-Report & Audit, dengan filter tema.",
    fields: [
      {
        kind: "list",
        name: "themes",
        label: "Tema filter",
        itemLabel: "tema",
        titleField: "label",
        help: "Slug tema dipakai saat memberi tema pada laporan di menu e-Report & Audit.",
        fields: [
          { kind: "text", name: "slug", label: "Slug (huruf kecil-dengan-tanda-hubung)" },
          { kind: "text", name: "label", label: "Label" },
        ],
      },
    ],
  },
  {
    type: "audits-db",
    family: "Transparansi",
    label: "Audit keuangan (otomatis)",
    description: "Teks pengantar dan accordion audit per tahun dari menu e-Report & Audit.",
    fields: [
      { kind: "strings", name: "headingLines", label: "Judul (per baris)", itemLabel: "baris" },
      { kind: "strings", name: "paragraphs", label: "Paragraf", itemLabel: "paragraf", multiline: true },
      { kind: "text", name: "badge", label: "Lencana", optional: true },
    ],
  },
  {
    type: "legal-db",
    family: "Transparansi",
    label: "Dokumen legalitas (otomatis)",
    description: "Paragraf pengantar dan daftar dokumen dari menu e-Report & Audit.",
    fields: [{ kind: "textarea", name: "intro", label: "Pengantar", optional: true }],
  },
  {
    type: "richtext",
    family: "Richtext",
    label: "Teks bebas",
    description: "Ditulis di editor visual; disimpan sebagai HTML tersanitasi.",
    fields: [{ kind: "html", name: "html", label: "Isi", help: "Tebal, tautan, daftar, gambar, dan video. Skrip dibuang saat disimpan." }],
  },
];

const BY_TYPE = new Map(SECTION_DEFS.map((d) => [d.type, d]));

export function sectionDef(type: string): SectionDef | undefined {
  return BY_TYPE.get(type as SectionType);
}

export function initialValue(field: Field): Json {
  switch (field.kind) {
    case "number":
      return field.initial ?? field.min ?? 0;
    case "select":
      return field.options[0]?.value ?? "";
    case "boolean":
      return false;
    case "image":
      return null;
    case "strings":
    case "categories":
    case "list":
      return [];
    default:
      return "";
  }
}

export function initialData(fields: readonly Field[]): JsonObject {
  return Object.fromEntries(fields.map((f) => [f.name, initialValue(f)]));
}

/** Ringkasan satu baris untuk daftar section: teks pertama yang terisi + jumlah butir. */
export function sectionSummary(def: SectionDef, data: JsonObject): string {
  const parts: string[] = [];
  for (const f of def.fields) {
    const v = data[f.name];
    if (parts.length === 0) {
      if ((f.kind === "text" || f.kind === "textarea") && typeof v === "string" && v.trim()) parts.push(v.trim());
      else if (f.kind === "strings" && Array.isArray(v) && typeof v[0] === "string" && v[0]) parts.push(v.filter((x) => typeof x === "string").join(" "));
      else if (f.kind === "html" && typeof v === "string" && v.trim()) parts.push(v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    }
    if (f.kind === "list" && Array.isArray(v) && v.length) parts.push(`${v.length} ${f.itemLabel}`);
    if (f.kind === "categories" && Array.isArray(v)) parts.push(v.length ? `kategori: ${v.join(", ")}` : "publikasi terbaru");
  }
  if (def.type === "hero" && !(typeof data.title === "string" && data.title.trim())) parts.unshift("Judul halaman");
  const text = parts.join(" · ");
  return text.length > 110 ? `${text.slice(0, 107).trimEnd()}…` : text || def.description;
}
