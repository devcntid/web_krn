/** Audit Keuangan — terjemahan bahasa Inggris. DRAF (16 Nov 2026): perlu ditinjau. */
import * as id from "../audit";

export const auditHero = id.auditHero;
export const auditIntro = {
  heading: ["Our Commitment to", "Transparency and Accountability"],
  paragraphs: [
    "Relawan Nusantara is audited regularly by an independent public accounting firm.",
    "These audits are carried out not only to comply with applicable regulations, but also to ensure that all financial management is conducted fairly, transparently, and in accordance with the accounting standards that apply in Indonesia.",
  ],
  badge: "Unqualified Opinion · 2021 – 2025",
};
export const auditReports = id.auditReports.map((r) => ({ ...r, title: `Year ${r.year}` }));
export const { auditPreviewUrl, auditPdfUrl } = id;
export const labels = { viewPdf: "View PDF", iframeTitle: (title: string) => `Financial audit report, ${title}`, pageTitle: "Financial Audits" };
export const seo = { title: "Financial Audits", description: "Relawan Nusantara is audited regularly by an independent public accounting firm." };
