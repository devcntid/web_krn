/** Tipe bersama server ↔ klien untuk /admin/laporan (tanpa kode server). */

export type AdminReport = {
  id: number;
  title: string;
  year: number;
  themes: string[];
  url: string;
  coverMediaId: number | null;
  coverUrl: string | null;
  visible: boolean;
  sort: number;
};

export type AdminAudit = {
  id: number;
  year: number;
  opinion: string;
  documentUrl: string;
  pdfMediaId: number | null;
  pdfUrl: string | null;
  pdfName: string | null;
};

export type AdminLegalDoc = { id: number; kind: string; text: string; kindEn: string; textEn: string; sort: number };

export type ReportInput = { title: string; year: number; themes: string[]; url: string; coverMediaId: number | null; visible: boolean };
export type AuditInput = { year: number; opinion: string; documentUrl: string; pdfMediaId: number | null };
export type LegalInput = { kind: string; text: string; kindEn: string; textEn: string };

export type TransparencyResult = { ok: true; message: string } | { ok: false; error: string };
