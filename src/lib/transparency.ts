import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { CACHE_TAGS } from "@/lib/content";
import { listAudits, listLegalDocs, listVisibleReports } from "@/server/repos/transparency";

/**
 * Data transparansi (e-Report, audit, legalitas) untuk halaman publik — dari tabel reports,
 * audits, legal_docs (dikelola di /admin/laporan). Cache bertag `transparency`.
 */
const opts = { tags: [CACHE_TAGS.transparency] };
export const getVisibleReports = cache(unstable_cache(listVisibleReports, ["transparency:reports"], opts));
export const getAudits = cache(unstable_cache(listAudits, ["transparency:audits"], opts));
export const getLegalDocs = cache(unstable_cache(listLegalDocs, ["transparency:legal"], opts));

/** URL pratinjau tersemat & tautan "Lihat PDF" sebuah audit: PDF di Blob bila ada, selain itu Google Drive. */
export function auditLinks(a: { pdfUrl: string | null; documentUrl: string | null }): { preview: string; view: string } | null {
  if (a.pdfUrl) return { preview: a.pdfUrl, view: a.pdfUrl };
  const drive = a.documentUrl?.match(/^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return { preview: `https://drive.google.com/file/d/${drive[1]}/preview?usp=embed_googleplus`, view: `https://drive.google.com/file/d/${drive[1]}/view` };
  return a.documentUrl ? { preview: a.documentUrl, view: a.documentUrl } : null;
}
