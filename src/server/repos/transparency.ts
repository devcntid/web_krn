import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb, schema } from "../db";

const { audits, legalDocs, media, reports } = schema;

/** Laporan penyaluran yang tampil (tahun terbaru dulu, lalu urutan). */
export async function listVisibleReports() {
  return getDb()
    .select({ id: reports.id, year: reports.year, title: reports.title, url: reports.url, themes: reports.themes, coverUrl: media.url, coverWidth: media.width, coverHeight: media.height })
    .from(reports)
    .leftJoin(media, eq(media.id, reports.coverMediaId))
    .where(eq(reports.visible, true))
    .orderBy(desc(reports.year), asc(reports.sort), asc(reports.id));
}

/** Audit per tahun (terbaru dulu) dengan PDF di Blob bila sudah diunggah. */
export async function listAudits() {
  return getDb()
    .select({ id: audits.id, year: audits.year, opinion: audits.opinion, documentUrl: audits.documentUrl, pdfUrl: media.url })
    .from(audits)
    .leftJoin(media, eq(media.id, audits.pdfMediaId))
    .orderBy(desc(audits.year));
}

export async function listLegalDocs() {
  return getDb().select().from(legalDocs).orderBy(asc(legalDocs.sort), asc(legalDocs.id));
}

export type VisibleReport = Awaited<ReturnType<typeof listVisibleReports>>[number];
export type AuditRow = Awaited<ReturnType<typeof listAudits>>[number];
export type LegalDocRow = Awaited<ReturnType<typeof listLegalDocs>>[number];

