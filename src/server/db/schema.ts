import "server-only";

import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Skema database Admin CMS — lihat docs/DATABASE.md dan "Model data" di
 * docs/BUILD_PLAYBOOK.md. Nama kolom di database memakai snake_case.
 *
 * File ini diberi `import "server-only"` seperti semua kode di src/server/.
 * drizzle-kit dan skrip CLI menjalankannya dengan `--conditions=react-server`
 * (lihat skrip `db:*` di package.json) agar impor itu tidak melempar error.
 */

/* ---------- Enum ---------- */

export const userRole = pgEnum("user_role", ["super_admin", "editor", "penulis", "kontributor", "viewer"]);
/** Alur: draft → review → scheduled → published (+ trashed). Dipakai post dan halaman. */
export const contentStatus = pgEnum("content_status", ["draft", "review", "scheduled", "published", "trashed"]);
/** legacy = hasil migrasi WordPress (path wp-content/uploads/…), blob = unggahan baru (media/…). */
export const mediaSource = pgEnum("media_source", ["legacy", "blob"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ---------- Pengguna & Auth.js ---------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull(),
    /** Kolom standar Auth.js. */
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    role: userRole("role").notNull().default("viewer"),
    passwordHash: text("password_hash"),
    /** Rahasia TOTP terenkripsi (AES-256-GCM, lihat src/server/auth/crypto.ts) — bukan plaintext. */
    totpSecret: text("totp_secret"),
    /** Diisi saat pendaftaran TOTP dikonfirmasi dengan kode valid; null = belum aktif. */
    totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
    /** Time step TOTP terakhir yang diterima — mencegah kode yang sama dipakai ulang. */
    totpLastStep: integer("totp_last_step"),
    /** Diisi saat akun dinonaktifkan (B13); null = aktif. */
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_key").on(sql`lower(${t.email})`), index("users_role_idx").on(t.role)],
);

/**
 * Percobaan login gagal (password & TOTP) untuk rate limiting tanpa infrastruktur baru.
 * key = "email:<email>" | "ip:<ip>" | "totp:<userId>". Baris lama boleh dibersihkan berkala.
 */
export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("auth_attempts_key_created_idx").on(t.key, t.createdAt)],
);

/** Akun OAuth (Google) — bentuk standar adapter Auth.js. */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] }), index("accounts_user_id_idx").on(t.userId)],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId), index("sessions_expires_idx").on(t.expires)],
);

/* ---------- Media ---------- */

export const media = pgTable(
  "media",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** URL publik lengkap (Blob) atau path /wp-content/uploads/… untuk media lama. */
    url: text("url").notNull(),
    source: mediaSource("source").notNull(),
    /** Pathname di Blob store, mis. wp-content/uploads/2026/11/foto.jpg atau media/2026/11/foto-abc.jpg. */
    pathname: text("pathname").notNull(),
    mime: text("mime").notNull(),
    size: integer("size"),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    caption: text("caption"),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("media_pathname_key").on(t.pathname),
    index("media_created_at_idx").on(t.createdAt),
    index("media_mime_idx").on(t.mime),
  ],
);

/* ---------- Publikasi ---------- */

export const posts = pgTable(
  "posts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** ID post di WordPress (hanya konten hasil migrasi) — kunci upsert saat seed. */
    legacyId: integer("legacy_id"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    /** Dokumen Tiptap; null untuk post lama yang hanya punya HTML. */
    contentJson: jsonb("content_json"),
    /** HTML tersanitasi yang dirender situs publik. */
    contentHtml: text("content_html").notNull().default(""),
    status: contentStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    featuredMediaId: integer("featured_media_id").references(() => media.id, { onDelete: "set null" }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImage: text("og_image"),
    canonical: text("canonical"),
    robots: text("robots"),
    /** JSON-LD asli Rank Math dari WordPress. */
    legacyJsonld: jsonb("legacy_jsonld"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("posts_slug_key").on(t.slug),
    uniqueIndex("posts_legacy_id_key").on(t.legacyId),
    index("posts_status_idx").on(t.status),
    index("posts_published_at_idx").on(t.publishedAt.desc()),
    // Daftar publik: post terbit terbaru dulu.
    index("posts_status_published_at_idx").on(t.status, t.publishedAt.desc()),
    index("posts_author_id_idx").on(t.authorId),
  ],
);

export const postRevisions = pgTable(
  "post_revisions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /** Salinan kolom post saat disimpan (judul, isi, SEO, kategori, tag). */
    snapshot: jsonb("snapshot").notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("post_revisions_post_id_idx").on(t.postId, t.createdAt.desc())],
);

/** draft = hasil terjemahan yang belum ditinjau; reviewed = sudah disetujui tim. */
export const translationStatus = pgEnum("translation_status", ["draft", "reviewed"]);

/**
 * Terjemahan post per bahasa (saat ini hanya "en"). Kolom yang null/kosong berarti
 * memakai nilai bahasa Indonesia. Sumbernya file di content/translations/ (seed) dan,
 * nantinya, editor admin.
 */
export const postTranslations = pgTable(
  "post_translations",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    contentHtml: text("content_html").notNull().default(""),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    status: translationStatus("status").notNull().default("draft"),
    /** `updated_at` post sumber saat diterjemahkan — untuk mendeteksi terjemahan yang usang. */
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.locale] }), index("post_translations_locale_status_idx").on(t.locale, t.status)],
);

/* ---------- Taksonomi ---------- */

export const categories = pgTable(
  "categories",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    legacyId: integer("legacy_id"),
    slug: text("slug").notNull(),
    /** Path arsip tanpa slash, mis. "hewan-lingkungan/air-bersih" → /category/<path>/. */
    path: text("path").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    parentId: integer("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
  },
  (t) => [
    uniqueIndex("categories_slug_key").on(t.slug),
    uniqueIndex("categories_path_key").on(t.path),
    uniqueIndex("categories_legacy_id_key").on(t.legacyId),
    index("categories_parent_id_idx").on(t.parentId),
  ],
);

/** Tag tidak berhierarki: tanpa path (arsipnya /tag/<slug>/) dan tanpa induk. */
export const tags = pgTable(
  "tags",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    legacyId: integer("legacy_id"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
  },
  (t) => [uniqueIndex("tags_slug_key").on(t.slug), uniqueIndex("tags_legacy_id_key").on(t.legacyId)],
);

export const postCategories = pgTable(
  "post_categories",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.categoryId] }), index("post_categories_category_id_idx").on(t.categoryId)],
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] }), index("post_tags_tag_id_idx").on(t.tagId)],
);

/* ---------- Halaman ---------- */

export const pages = pgTable(
  "pages",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    legacyId: integer("legacy_id"),
    /** Path penuh tanpa slash depan/belakang, mis. "pr0gram-kami/kerelawanan". */
    path: text("path").notNull(),
    title: text("title").notNull(),
    /** generic | pilar | profil | … — menentukan renderer halaman. */
    template: text("template").notNull().default("generic"),
    /** Daftar section berurutan (tipe + data + visible); skemanya divalidasi Zod di B7. */
    sections: jsonb("sections").notNull().default(sql`'[]'::jsonb`),
    status: contentStatus("status").notNull().default("draft"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImage: text("og_image"),
    canonical: text("canonical"),
    robots: text("robots"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("pages_path_key").on(t.path),
    uniqueIndex("pages_legacy_id_key").on(t.legacyId),
    index("pages_status_idx").on(t.status),
  ],
);

/* ---------- Transparansi ---------- */

export const reports = pgTable(
  "reports",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    /** Tahun pengelompokan di /e-report/. */
    year: integer("year").notNull(),
    /** Slug tema filter (palestina, kurban-zakat, penyaluran-bulanan); satu laporan bisa punya beberapa. */
    themes: text("themes").array().notNull().default(sql`'{}'::text[]`),
    /** Flipbook (hflip/Heyzine) atau PDF. */
    url: text("url").notNull(),
    coverMediaId: integer("cover_media_id").references(() => media.id, { onDelete: "set null" }),
    visible: boolean("visible").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("reports_visible_year_sort_idx").on(t.visible, t.year.desc(), t.sort)],
);

export const audits = pgTable(
  "audits",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    year: integer("year").notNull(),
    /** Mis. "Wajar Tanpa Pengecualian". */
    opinion: text("opinion"),
    /** PDF di Vercel Blob (setelah diunggah lewat admin). */
    pdfMediaId: integer("pdf_media_id").references(() => media.id, { onDelete: "set null" }),
    /** Tautan dokumen eksternal — saat ini berkas Google Drive dari situs WordPress. */
    documentUrl: text("document_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("audits_year_key").on(t.year)],
);

export const legalDocs = pgTable(
  "legal_docs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** Jenis dokumen, mis. "Akta Pendirian". */
    kind: text("kind").notNull(),
    text: text("text").notNull(),
    /** Versi Inggris (/en/); null = memakai teks Indonesia. */
    kindEn: text("kind_en"),
    textEn: text("text_en"),
    sort: integer("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("legal_docs_sort_idx").on(t.sort)],
);

/* ---------- SEO ---------- */

export const redirects = pgTable(
  "redirects",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** Path sumber dengan slash depan, mis. "/beranda/". */
    source: text("source").notNull(),
    /** Path atau URL tujuan; kosong hanya untuk 410. */
    destination: text("destination").notNull().default(""),
    statusCode: integer("status_code").notNull().default(301),
    note: text("note"),
    hits: integer("hits").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("redirects_source_key").on(t.source),
    check("redirects_status_code_check", sql`${t.statusCode} in (301, 302, 307, 308, 410)`),
  ],
);

export const notFoundLog = pgTable(
  "not_found_log",
  {
    path: text("path").primaryKey(),
    hits: integer("hits").notNull().default(1),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("not_found_log_hits_idx").on(t.hits.desc()), index("not_found_log_last_seen_idx").on(t.lastSeen.desc())],
);

/* ---------- Pengaturan & log ---------- */

/** Pasangan kunci → nilai JSON: identity, contact, socials, menu, integrations, home. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

export const activityLog = pgTable(
  "activity_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    /** Null bila pengguna dihapus atau aksi dilakukan sistem (cron). */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    /** publish | edit | delete | login | setup | … */
    action: text("action").notNull(),
    /** Nama entitas: post, page, media, redirect, user, settings, … */
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    /** Perubahan sebelum/sesudah untuk tombol "Lihat". */
    diff: jsonb("diff"),
    createdAt: createdAt(),
  },
  (t) => [
    index("activity_log_created_at_idx").on(t.createdAt.desc()),
    index("activity_log_entity_idx").on(t.entity, t.entityId),
    index("activity_log_user_id_idx").on(t.userId),
    index("activity_log_action_idx").on(t.action),
  ],
);
