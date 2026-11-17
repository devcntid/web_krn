import "server-only";

import { asc, desc, eq, sql } from "drizzle-orm";

import type { AdminAudit, AdminLegalDoc, AdminReport, AuditInput, LegalInput, ReportInput, TransparencyResult } from "@/types/admin-transparency";
import { type DbOrTx, logActivity } from "./activity";
import { getDb, schema } from "./db";
import type { AuthUser } from "./permissions";
import { parseSections } from "./sections";

const { audits, legalDocs, media, pages, reports } = schema;

class TError extends Error {}
const ok = (message: string): TransparencyResult => ({ ok: true, message });
const run = async (fn: () => Promise<TransparencyResult>): Promise<TransparencyResult> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof TError) return { ok: false, error: error.message };
    const code = (error as { cause?: { code?: string }; code?: string })?.cause?.code ?? (error as { code?: string })?.code;
    if (code === "23505") return { ok: false, error: "Tahun audit ini sudah ada." };
    console.error("laporan gagal", error);
    return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  }
};

const httpsUrl = (value: string, what: string, allowPath = false) => {
  const v = value.trim();
  if (!(allowPath ? /^(https:\/\/|\/(?!\/))/ : /^https:\/\//).test(v)) throw new TError(`${what} harus diawali https://${allowPath ? " atau /" : ""}.`);
  if (v.length > 2000) throw new TError(`${what} terlalu panjang.`);
  return v;
};
const year = (y: number) => {
  if (!Number.isInteger(y) || y < 2000 || y > 2100) throw new TError("Tahun tidak sah.");
  return y;
};
async function mediaOfKind(tx: DbOrTx, id: number | null, prefix: string, what: string): Promise<number | null> {
  if (id === null) return null;
  const [m] = await tx.select({ id: media.id, mime: media.mime }).from(media).where(eq(media.id, id)).limit(1);
  if (!m || !m.mime.startsWith(prefix)) throw new TError(`${what} tidak ditemukan di pustaka media.`);
  return m.id;
}

/* ---------- Daftar ---------- */

export async function listAdminReports(): Promise<AdminReport[]> {
  return getDb()
    .select({ id: reports.id, title: reports.title, year: reports.year, themes: reports.themes, url: reports.url, coverMediaId: reports.coverMediaId, coverUrl: media.url, visible: reports.visible, sort: reports.sort })
    .from(reports)
    .leftJoin(media, eq(media.id, reports.coverMediaId))
    .orderBy(desc(reports.year), asc(reports.sort), asc(reports.id));
}

export async function listAdminAudits(): Promise<AdminAudit[]> {
  const rows = await getDb()
    .select({ id: audits.id, year: audits.year, opinion: audits.opinion, documentUrl: audits.documentUrl, pdfMediaId: audits.pdfMediaId, pdfUrl: media.url, pdfPath: media.pathname })
    .from(audits)
    .leftJoin(media, eq(media.id, audits.pdfMediaId))
    .orderBy(desc(audits.year));
  return rows.map((r) => ({ id: r.id, year: r.year, opinion: r.opinion ?? "", documentUrl: r.documentUrl ?? "", pdfMediaId: r.pdfMediaId, pdfUrl: r.pdfUrl, pdfName: r.pdfPath?.split("/").pop() ?? null }));
}

export async function listAdminLegalDocs(): Promise<AdminLegalDoc[]> {
  const rows = await getDb().select().from(legalDocs).orderBy(asc(legalDocs.sort), asc(legalDocs.id));
  return rows.map((r) => ({ id: r.id, kind: r.kind, text: r.text, kindEn: r.kindEn ?? "", textEn: r.textEn ?? "", sort: r.sort }));
}

/** Tema yang tersedia = tema filter di section "Daftar e-Report" halaman /e-report/. */
export async function reportThemeOptions(): Promise<{ slug: string; label: string }[]> {
  const [page] = await getDb().select({ sections: pages.sections }).from(pages).where(eq(pages.path, "e-report")).limit(1);
  const section = parseSections(page?.sections).sections.find((s) => s.type === "reports-db" || s.type === "reports");
  return section && "themes" in section.data ? section.data.themes : [];
}

/* ---------- Laporan penyaluran ---------- */

/** Nomori ulang urutan laporan satu tahun menjadi 0..n-1 (tanpa celah). */
async function renumberYear(tx: DbOrTx, y: number): Promise<void> {
  const list = await tx.select({ id: reports.id, sort: reports.sort }).from(reports).where(eq(reports.year, y)).orderBy(asc(reports.sort), asc(reports.id));
  for (const [i, r] of list.entries()) if (r.sort !== i) await tx.update(reports).set({ sort: i }).where(eq(reports.id, r.id));
}

async function cleanReport(tx: DbOrTx, input: ReportInput) {
  const title = input.title.trim().replace(/\s+/g, " ");
  if (!title) throw new TError("Judul wajib diisi.");
  if (title.length > 300) throw new TError("Judul terlalu panjang.");
  const themes = [...new Set(input.themes.map((t) => t.trim()).filter((t) => /^[a-z0-9-]+$/.test(t)))].slice(0, 10);
  const coverMediaId = await mediaOfKind(tx, input.coverMediaId, "image/", "Sampul");
  if (input.visible && coverMediaId === null) throw new TError("Pilih sampul sebelum menampilkan laporan di situs.");
  return { title, year: year(input.year), themes, url: httpsUrl(input.url, "URL laporan"), coverMediaId, visible: input.visible };
}

export function createReport(user: AuthUser, input: ReportInput) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const v = await cleanReport(tx, input);
      // Laporan baru tampil paling depan di tahunnya.
      await tx.update(reports).set({ sort: sql`${reports.sort} + 1` }).where(eq(reports.year, v.year));
      const [row] = await tx.insert(reports).values({ ...v, sort: 0 }).returning({ id: reports.id });
      await logActivity({ userId: user.id, action: "create", entity: "report", entityId: row?.id, summary: `Menambah laporan “${v.title}”` }, tx);
      return ok("Laporan ditambahkan.");
    }),
  );
}

export function updateReport(user: AuthUser, id: number, input: ReportInput) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const [old] = await tx.select().from(reports).where(eq(reports.id, id)).limit(1);
      if (!old) throw new TError("Laporan tidak ditemukan.");
      const v = await cleanReport(tx, input);
      const moved = old.year !== v.year;
      if (moved) await tx.update(reports).set({ sort: sql`${reports.sort} + 1` }).where(eq(reports.year, v.year));
      await tx.update(reports).set({ ...v, ...(moved ? { sort: 0 } : {}) }).where(eq(reports.id, id));
      if (moved) await renumberYear(tx, old.year);
      const diff: Record<string, unknown> = {};
      for (const k of ["title", "year", "url", "visible", "coverMediaId"] as const) if (old[k] !== v[k]) diff[k] = [old[k], v[k]];
      if (old.themes.join() !== v.themes.join()) diff.themes = [old.themes, v.themes];
      await logActivity({ userId: user.id, action: "edit", entity: "report", entityId: id, summary: `Mengubah laporan “${v.title}”`, diff }, tx);
      return ok("Laporan disimpan.");
    }),
  );
}

export function setReportVisible(user: AuthUser, id: number, visible: boolean) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const [old] = await tx.select({ title: reports.title, cover: reports.coverMediaId }).from(reports).where(eq(reports.id, id)).limit(1);
      if (!old) throw new TError("Laporan tidak ditemukan.");
      if (visible && old.cover === null) throw new TError("Laporan tanpa sampul tidak bisa ditampilkan.");
      await tx.update(reports).set({ visible }).where(eq(reports.id, id));
      await logActivity({ userId: user.id, action: visible ? "publish" : "unpublish", entity: "report", entityId: id, summary: `${visible ? "Menampilkan" : "Menyembunyikan"} laporan “${old.title}”` }, tx);
      return ok(visible ? "Laporan ditampilkan." : "Laporan disembunyikan.");
    }),
  );
}

/** Tukar urutan dengan laporan di sebelahnya (dalam tahun yang sama). */
export function moveReport(user: AuthUser, id: number, step: -1 | 1) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const [cur] = await tx.select().from(reports).where(eq(reports.id, id)).limit(1);
      if (!cur) throw new TError("Laporan tidak ditemukan.");
      // Rapikan urutan tahun ini dulu (0..n-1) agar penukaran selalu tepat satu posisi.
      await renumberYear(tx, cur.year);
      const list = await tx.select({ id: reports.id }).from(reports).where(eq(reports.year, cur.year)).orderBy(asc(reports.sort), asc(reports.id));
      const index = list.findIndex((r) => r.id === id);
      const other = list[index + step];
      if (!other) return ok("Sudah di ujung.");
      await tx.update(reports).set({ sort: index + step }).where(eq(reports.id, id));
      await tx.update(reports).set({ sort: index }).where(eq(reports.id, other.id));
      await logActivity({ userId: user.id, action: "edit", entity: "report", entityId: id, summary: `Mengubah urutan laporan “${cur.title}”` }, tx);
      return ok("Urutan diubah.");
    }),
  );
}

export function deleteReport(user: AuthUser, id: number) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const [old] = await tx.delete(reports).where(eq(reports.id, id)).returning();
      if (!old) throw new TError("Laporan tidak ditemukan.");
      await renumberYear(tx, old.year);
      await logActivity({ userId: user.id, action: "delete", entity: "report", entityId: id, summary: `Menghapus laporan “${old.title}”`, diff: { title: old.title, url: old.url, year: old.year } }, tx);
      return ok("Laporan dihapus. Sampulnya tetap ada di pustaka media.");
    }),
  );
}

/* ---------- Audit ---------- */

async function cleanAudit(tx: DbOrTx, input: AuditInput) {
  const pdfMediaId = await mediaOfKind(tx, input.pdfMediaId, "application/pdf", "PDF");
  const documentUrl = input.documentUrl.trim() ? httpsUrl(input.documentUrl, "Tautan dokumen") : null;
  if (!pdfMediaId && !documentUrl) throw new TError("Unggah PDF atau isi tautan dokumen.");
  return { year: year(input.year), opinion: input.opinion.trim().slice(0, 200) || null, documentUrl, pdfMediaId };
}

export function saveAudit(user: AuthUser, id: number | null, input: AuditInput) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const v = await cleanAudit(tx, input);
      if (id === null) {
        const [row] = await tx.insert(audits).values(v).returning({ id: audits.id });
        await logActivity({ userId: user.id, action: "create", entity: "audit", entityId: row?.id, summary: `Menambah audit tahun ${v.year}` }, tx);
        return ok(`Audit ${v.year} ditambahkan.`);
      }
      const [old] = await tx.select().from(audits).where(eq(audits.id, id)).limit(1);
      if (!old) throw new TError("Audit tidak ditemukan.");
      await tx.update(audits).set(v).where(eq(audits.id, id));
      const diff: Record<string, unknown> = {};
      for (const k of ["year", "opinion", "documentUrl", "pdfMediaId"] as const) if ((old[k] ?? null) !== (v[k] ?? null)) diff[k] = [old[k], v[k]];
      await logActivity({ userId: user.id, action: "edit", entity: "audit", entityId: id, summary: `Mengubah audit tahun ${v.year}${diff.pdfMediaId ? " (PDF diganti)" : ""}`, diff }, tx);
      return ok(`Audit ${v.year} disimpan.`);
    }),
  );
}

export function deleteAudit(user: AuthUser, id: number) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const [old] = await tx.delete(audits).where(eq(audits.id, id)).returning();
      if (!old) throw new TError("Audit tidak ditemukan.");
      await logActivity({ userId: user.id, action: "delete", entity: "audit", entityId: id, summary: `Menghapus audit tahun ${old.year}`, diff: { year: old.year, documentUrl: old.documentUrl, pdfMediaId: old.pdfMediaId } }, tx);
      return ok(`Audit ${old.year} dihapus. PDF-nya tetap ada di pustaka media.`);
    }),
  );
}

/* ---------- Dokumen legalitas ---------- */

function cleanLegal(input: LegalInput) {
  const kind = input.kind.trim().replace(/\s+/g, " ").slice(0, 120);
  const text = input.text.trim().replace(/\s+/g, " ").slice(0, 2000);
  if (!kind || !text) throw new TError("Jenis dan teks dokumen wajib diisi.");
  return { kind, text, kindEn: input.kindEn.trim().replace(/\s+/g, " ").slice(0, 120) || null, textEn: input.textEn.trim().replace(/\s+/g, " ").slice(0, 2000) || null };
}

export function saveLegalDoc(user: AuthUser, id: number | null, input: LegalInput) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const v = cleanLegal(input);
      if (id === null) {
        const [last] = await tx.select({ sort: legalDocs.sort }).from(legalDocs).orderBy(desc(legalDocs.sort)).limit(1);
        const [row] = await tx.insert(legalDocs).values({ ...v, sort: (last?.sort ?? -1) + 1 }).returning({ id: legalDocs.id });
        await logActivity({ userId: user.id, action: "create", entity: "legal_doc", entityId: row?.id, summary: `Menambah dokumen legalitas “${v.kind}”` }, tx);
        return ok("Dokumen ditambahkan.");
      }
      const [old] = await tx.select().from(legalDocs).where(eq(legalDocs.id, id)).limit(1);
      if (!old) throw new TError("Dokumen tidak ditemukan.");
      await tx.update(legalDocs).set(v).where(eq(legalDocs.id, id));
      const diff: Record<string, unknown> = {};
      for (const k of ["kind", "text", "kindEn", "textEn"] as const) if ((old[k] ?? null) !== (v[k] ?? null)) diff[k] = [old[k], v[k]];
      await logActivity({ userId: user.id, action: "edit", entity: "legal_doc", entityId: id, summary: `Mengubah dokumen legalitas “${v.kind}”`, diff }, tx);
      return ok("Dokumen disimpan.");
    }),
  );
}

export function moveLegalDoc(user: AuthUser, id: number, step: -1 | 1) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const list = await tx.select({ id: legalDocs.id, kind: legalDocs.kind, sort: legalDocs.sort }).from(legalDocs).orderBy(asc(legalDocs.sort), asc(legalDocs.id));
      const index = list.findIndex((d) => d.id === id);
      if (index < 0) throw new TError("Dokumen tidak ditemukan.");
      const other = list[index + step];
      if (!other) return ok("Sudah di ujung.");
      const next = [...list];
      next[index] = other;
      next[index + step] = list[index] as (typeof list)[number];
      // Hanya baris yang nomor urutnya berubah yang ditulis.
      for (const [i, d] of next.entries()) if (d.sort !== i) await tx.update(legalDocs).set({ sort: i }).where(eq(legalDocs.id, d.id));
      await logActivity({ userId: user.id, action: "edit", entity: "legal_doc", entityId: id, summary: `Mengubah urutan dokumen legalitas “${list[index]?.kind}”` }, tx);
      return ok("Urutan diubah.");
    }),
  );
}

export function deleteLegalDoc(user: AuthUser, id: number) {
  return run(() =>
    getDb().transaction(async (tx) => {
      const [old] = await tx.delete(legalDocs).where(eq(legalDocs.id, id)).returning();
      if (!old) throw new TError("Dokumen tidak ditemukan.");
      await logActivity({ userId: user.id, action: "delete", entity: "legal_doc", entityId: id, summary: `Menghapus dokumen legalitas “${old.kind}”`, diff: { kind: old.kind, text: old.text } }, tx);
      return ok("Dokumen dihapus.");
    }),
  );
}

