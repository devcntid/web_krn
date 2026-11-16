/**
 * e-Report — bahasa Inggris. Judul laporan TIDAK diterjemahkan (judul dokumen asli
 * di sampul); yang diterjemahkan hanya label antarmuka. DRAF (16 Nov 2026).
 */
import * as id from "../reports";

export const reports = id.reports;
export const reportThemes = [
  { slug: "palestina", label: "Palestine" },
  { slug: "kurban-zakat", label: "Qurban & Zakat" },
  { slug: "penyaluran-bulanan", label: "Monthly Distribution" },
] as const satisfies readonly { slug: id.ReportTheme; label: string }[];
export const reportsPage = {
  ...id.reportsPage,
  description: "Take a closer look at how each of these efforts came to life. We have gathered them into one report for you to explore.",
};
export const labels = { all: "All", filterAria: "Filter reports by theme", shown: (n: number) => `${n} reports shown`, read: "Read Report", newTab: "new tab" };
export const seo = { title: "e-Reporting", description: reportsPage.description };
