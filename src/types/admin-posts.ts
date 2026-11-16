/** Tipe bersama server ↔ klien untuk /admin/publikasi (tanpa kode server). */

export type ContentStatus = "draft" | "review" | "scheduled" | "published" | "trashed";

export const CONTENT_STATUSES: readonly ContentStatus[] = ["draft", "review", "scheduled", "published", "trashed"];

export type MediaChoice = {
  id: number;
  /** URL Blob atau path lama /wp-content/uploads/… (tampilkan lewat mediaUrl()). */
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type TagRef = { id: number; name: string };
export type CategoryOption = { id: number; name: string; slug: string; parentId: number | null };
export type UserOption = { id: string; name: string };

/** Data awal editor. Tanggal berupa ISO string agar bisa dikirim ke Client Component. */
export type EditorPost = {
  id: number | null;
  slug: string;
  title: string;
  excerpt: string;
  /** Dokumen Tiptap; null untuk post lama yang hanya punya HTML. */
  contentJson: unknown;
  contentHtml: string;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string | null;
  authorId: string | null;
  reviewerId: string | null;
  featured: MediaChoice | null;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  categoryIds: number[];
  tags: TagRef[];
};

/**
 * autosave = simpan draf otomatis (tanpa revisi/log) · save = simpan tanpa mengubah status ·
 * review = kirim ke Review · publish = terbitkan/perbarui · schedule = jadwalkan · draft = kembalikan ke draf.
 */
export type SaveIntent = "autosave" | "save" | "review" | "publish" | "schedule" | "draft";

export type SavePostInput = {
  id: number | null;
  intent: SaveIntent;
  title: string;
  slug: string;
  /** Slug masih mengikuti judul (belum diubah manual) → server boleh menambah akhiran agar unik. */
  slugAuto: boolean;
  excerpt: string;
  /** Hanya dikirim bila badan tulisan diubah; bila tidak ada, isi tersimpan tidak disentuh. */
  content?: { json: unknown; html: string };
  categoryIds: number[];
  tagIds: number[];
  newTags: string[];
  featuredMediaId: number | null;
  /** Teks alt yang diisi di MediaPicker; disimpan ke pustaka bila media belum punya alt. */
  featuredAlt?: string;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  authorId: string | null;
  reviewerId: string | null;
  /** Nilai <input type="datetime-local"> dalam WIB ("2026-11-20T09:00") atau null. */
  publishAt: string | null;
};

export type SaveField = "title" | "slug" | "publishAt" | "canonical";

export type SaveResult =
  | {
      ok: true;
      id: number;
      slug: string;
      status: ContentStatus;
      excerpt: string;
      publishedAt: string | null;
      savedAt: string;
    }
  | { ok: false; error: string; field?: SaveField };

export type RevisionSummary = {
  id: number;
  createdAt: string;
  author: string | null;
  title: string;
  status: ContentStatus | null;
};

export type MediaPage = { items: MediaChoice[]; total: number; page: number; pageSize: number };

export type BulkResult = { message: string; tone: "success" | "error" | "info" };
