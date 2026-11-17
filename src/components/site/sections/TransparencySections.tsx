import { auditLinks, getAudits, getLegalDocs, getVisibleReports } from "@/lib/transparency";
import type { SectionData } from "@/server/sections";

import { AccordionDocs } from "./AccordionSections";
import { CardsDocs } from "./CardSections";
import { ReportsSection } from "./ReportsSection";
import type { SectionContext } from "./types";

/*
 * Section transparansi yang butirnya dibaca dari tabel (dikelola di /admin/laporan). Markup memakai
 * renderer yang sama dengan versi isian manual, sehingga tampilan publik tidak berubah.
 */

/** Sampul tanpa dimensi tersimpan memakai rasio sampul e-Report (1414×2000). */
export async function ReportsDbSection({ data, ctx }: { data: SectionData<"reports-db">; ctx: SectionContext }) {
  const rows = await getVisibleReports();
  const items = rows
    .filter((r) => r.coverUrl)
    .map((r) => ({
      year: r.year,
      title: r.title,
      url: r.url,
      themes: r.themes,
      cover: { src: r.coverUrl ?? "", width: r.coverWidth ?? 1414, height: r.coverHeight ?? 2000, alt: "" },
    }));
  return <ReportsSection data={{ themes: data.themes, items }} ctx={ctx} />;
}

export async function AuditsDbSection({ data, ctx }: { data: SectionData<"audits-db">; ctx: SectionContext }) {
  const items = (await getAudits()).flatMap((a) => {
    const links = auditLinks(a);
    return links ? [{ title: ctx.locale === "en" ? `Year ${a.year}` : `Tahun ${a.year}`, previewUrl: links.preview, pdfUrl: links.view }] : [];
  });
  if (!items.length) return null;
  return <AccordionDocs data={{ ...data, items }} ctx={ctx} />;
}

export async function LegalDbSection({ data, ctx }: { data: SectionData<"legal-db">; ctx: SectionContext }) {
  const en = ctx.locale === "en";
  const items = (await getLegalDocs()).map((d) => ({ kind: (en && d.kindEn) || d.kind, text: (en && d.textEn) || d.text }));
  if (!items.length) return null;
  return <CardsDocs data={{ intro: data.intro, items }} />;
}
