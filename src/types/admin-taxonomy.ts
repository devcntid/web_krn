/** Tipe bersama server ↔ klien untuk /admin/taksonomi (tanpa kode server). */

export type TaxonomyKind = "category" | "tag";

export type TaxonomyRow = {
  id: number;
  kind: TaxonomyKind;
  name: string;
  slug: string;
  /** Path arsip tanpa slash, mis. "ramadhan/fidyah" (tag: sama dengan slug). */
  path: string;
  description: string;
  parentId: number | null;
  /** Jumlah publikasi (semua status kecuali sampah). */
  count: number;
  depth: number;
};

export type TermInput = { name: string; slug: string; parentId: number | null; description: string };

export type TaxonomyResult = { ok: true; message: string } | { ok: false; error: string; field?: "name" | "slug" | "parentId" | "target" };
