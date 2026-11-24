/** Tipe bersama server ↔ klien untuk /admin/halaman (tanpa kode server). */
import type { JsonObject } from "@/lib/section-fields";
import type { PageTemplate, SectionIssue } from "@/server/sections";

export type PageStatus = "draft" | "published";

/** Baris daftar halaman. */
export type AdminPageItem = {
  id: number;
  path: string;
  title: string;
  status: "draft" | "review" | "scheduled" | "published" | "trashed";
  /** editable = disusun dari section; system = dirender otomatis (beranda, daftar artikel/berita). */
  kind: "editable" | "system";
  /** Path ini dialihkan (301) oleh redirect lama. */
  redirected: boolean;
};

/** Section di editor: isi belum tentu sah (divalidasi server saat disimpan). */
export type EditorSection = { id: string; type: string; visible: boolean; data: JsonObject; en?: JsonObject };

export type EditorPage = {
  id: number;
  path: string;
  title: string;
  status: AdminPageItem["status"];
  template: PageTemplate;
  seoTitle: string;
  seoDescription: string;
  sections: EditorSection[];
  /** Section tersimpan yang tidak lolos validasi (tidak ditampilkan; hilang bila disimpan). */
  dropped: number;
};

export type SavePageInput = {
  id: number;
  title: string;
  status: PageStatus;
  template: PageTemplate;
  seoTitle: string;
  seoDescription: string;
  sections: EditorSection[];
};

export type SavePageResult = { ok: true; savedAt: string } | { ok: false; error: string; issues?: SectionIssue[] };

export type CreatePageInput = { title: string; slug: string; parentPath: string; editor?: "classic" | "visual" };
export type CreatePageResult = { ok: true; id: number } | { ok: false; error: string; field?: "title" | "slug" };
