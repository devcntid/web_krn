/**
 * Pindahkan data transparansi ke tabel (prompt B11):
 *  - reports    ← src/content/reports.ts (urutan & tema dipertahankan; sampul = baris di tabel media)
 *  - audits     ← src/content/audit.ts (dokumen Google Drive; PDF Blob bisa diunggah di admin)
 *  - legal_docs ← src/content/legal.ts + src/content/en/legal.ts (kolom *_en)
 * lalu ganti section daftar di /e-report/, /audit-keuangan/, /asas-legalitas/ dengan tipe "*-db"
 * yang membaca tabel tersebut (judul, pengantar, label tema tetap di section).
 *
 *   npm run db:seed:transparency            → tulis (tabel yang sudah berisi dilewati)
 *   npm run db:seed:transparency -- --dry   → hanya periksa
 */
import { loadEnvConfig } from "@next/env";
import { eq, inArray, sql } from "drizzle-orm";

import * as auditId from "@/content/audit";
import * as legalEn from "@/content/en/legal";
import * as legalId from "@/content/legal";
import * as reportsId from "@/content/reports";
import { getDb, schema } from "@/server/db";
import { parseSections } from "@/server/sections";

loadEnvConfig(process.cwd());

const { audits, legalDocs, media, pages, reports } = schema;

type StoredSection = { id: string; type: string; visible: boolean; data: Record<string, unknown>; en?: Record<string, unknown> };

/** Ganti section bertipe `from` di halaman `path` menjadi `to` dengan isi hasil `map`. */
async function convertSection(path: string, from: string, to: string, map: (d: Record<string, unknown>) => Record<string, unknown>, dry: boolean): Promise<string> {
  const db = getDb();
  const [page] = await db.select({ id: pages.id, sections: pages.sections }).from(pages).where(eq(pages.path, path)).limit(1);
  if (!page) return `✗ ${path}: halaman tidak ada`;
  const list = (Array.isArray(page.sections) ? page.sections : []) as StoredSection[];
  if (list.some((s) => s.type === to)) return `– ${path}: sudah memakai ${to}`;
  const index = list.findIndex((s) => s.type === from);
  if (index < 0) return `✗ ${path}: section ${from} tidak ditemukan`;
  const old = list[index] as StoredSection;
  const next = [...list];
  next[index] = { id: old.id, type: to, visible: old.visible, data: map(old.data), ...(old.en ? { en: map(old.en) } : {}) };
  const { issues } = parseSections(next);
  if (issues.length) return `✗ ${path}: ${issues.map((i) => `${i.type} ${i.path} ${i.message}`).join("; ")}`;
  if (!dry) await db.update(pages).set({ sections: next, updatedAt: sql`${pages.updatedAt}` }).where(eq(pages.id, page.id));
  return `✓ ${path}: ${from} → ${to}`;
}

async function main() {
  const dry = process.argv.includes("--dry");
  const db = getDb();
  const out: string[] = [];

  /* ---------- reports ---------- */
  const [{ n: reportCount } = { n: 0 }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(reports);
  if (reportCount > 0) out.push(`– reports: sudah berisi ${reportCount} baris, dilewati`);
  else {
    const urls = [...new Set(reportsId.reports.map((r) => r.cover.src))];
    const covers = await db.select({ id: media.id, url: media.url, width: media.width }).from(media).where(inArray(media.url, urls));
    const byUrl = new Map(covers.map((c) => [c.url, c]));
    const missing = urls.filter((u) => !byUrl.has(u));
    if (missing.length) throw new Error(`Sampul belum ada di tabel media: ${missing.join(", ")}`);
    if (!dry) {
      await db.transaction(async (tx) => {
        // Dimensi sampul (diketahui dari konten) dilengkapi di tabel media bila masih kosong.
        for (const r of reportsId.reports) {
          const c = byUrl.get(r.cover.src);
          if (c && c.width === null) await tx.update(media).set({ width: r.cover.width, height: r.cover.height }).where(eq(media.id, c.id));
        }
        await tx.insert(reports).values(
          reportsId.reports.map((r, i) => ({ title: r.title, year: r.year, themes: [...r.themes], url: r.url, coverMediaId: byUrl.get(r.cover.src)?.id ?? null, visible: true, sort: i })),
        );
      });
    }
    out.push(`✓ reports: ${reportsId.reports.length} laporan`);
  }

  /* ---------- audits ---------- */
  const [{ n: auditCount } = { n: 0 }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(audits);
  if (auditCount > 0) out.push(`– audits: sudah berisi ${auditCount} baris, dilewati`);
  else {
    if (!dry) {
      await db.insert(audits).values(
        // Opini dari lencana halaman & teks predikat footer: WTP untuk laporan 2021 – 2025.
        auditId.auditReports.map((r) => ({ year: r.year, opinion: "Wajar Tanpa Pengecualian", documentUrl: auditId.auditPdfUrl(r) })),
      );
    }
    out.push(`✓ audits: ${auditId.auditReports.length} tahun`);
  }

  /* ---------- legal_docs ---------- */
  const [{ n: legalCount } = { n: 0 }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(legalDocs);
  if (legalCount > 0) out.push(`– legal_docs: sudah berisi ${legalCount} baris, dilewati`);
  else {
    if (legalEn.legalDocs.length !== legalId.legalDocs.length) throw new Error("Jumlah dokumen legalitas id/en berbeda");
    if (!dry) {
      await db.insert(legalDocs).values(
        legalId.legalDocs.map((d, i) => ({ kind: d.kind, text: d.text, kindEn: legalEn.legalDocs[i]?.kind ?? null, textEn: legalEn.legalDocs[i]?.text ?? null, sort: i })),
      );
    }
    out.push(`✓ legal_docs: ${legalId.legalDocs.length} dokumen (+ teks Inggris)`);
  }

  /* ---------- section halaman ---------- */
  out.push(await convertSection("e-report", "reports", "reports-db", (d) => ({ themes: d.themes ?? [] }), dry));
  out.push(await convertSection("audit-keuangan", "accordion-docs", "audits-db", (d) => ({ headingLines: d.headingLines, paragraphs: d.paragraphs ?? [], badge: d.badge ?? "" }), dry));
  out.push(await convertSection("asas-legalitas", "cards-docs", "legal-db", (d) => ({ intro: d.intro ?? "" }), dry));

  console.log(out.join("\n"));
  if (out.some((l) => l.startsWith("✗"))) process.exit(1);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
