/**
 * Pemilih konten per bahasa untuk halaman yang kontennya dikelola di kode.
 * Indonesia = src/content/*.ts (sumber, verbatim dari WordPress);
 * Beranda TIDAK lagi dibaca dari sini: isinya di `settings.home` (src/lib/home.ts, /admin/beranda);
 * src/content/home.ts dan en/home.ts hanya sumber `npm run db:seed:home` + judul SEO Inggris.
 * Inggris   = src/content/en/*.ts (draf terjemahan, mewarisi struktur & gambar).
 */
import type { Locale } from "@/i18n/config";

import * as auditEn from "./en/audit";
import * as homeEn from "./en/home";
import * as legalEn from "./en/legal";
import * as partnershipEn from "./en/partnership";
import * as pillarsEn from "./en/pillars";
import * as profileEn from "./en/profile";
import * as programsEn from "./en/programs";
import * as reportsEn from "./en/reports";
import * as auditId from "./audit";
import * as legalId from "./legal";
import * as partnershipId from "./partnership";
import * as pillarsId from "./pillars";
import * as profileId from "./profile";
import * as programsId from "./programs";
import * as reportsId from "./reports";

const en = (locale: Locale) => locale === "en";

export const profileContent = (l: Locale) => (en(l) ? profileEn : profileId);
export const auditContent = (l: Locale) => (en(l) ? auditEn : auditId);
export const legalContent = (l: Locale) => (en(l) ? legalEn : legalId);
export const partnershipContent = (l: Locale) => (en(l) ? partnershipEn : partnershipId);
export const pillarsContent = (l: Locale) => (en(l) ? pillarsEn.pillars : pillarsId.pillars);
export const programsContent = (l: Locale) => (en(l) ? programsEn : programsId);
export const reportsContent = (l: Locale): { reports: reportsId.Report[]; reportThemes: readonly { slug: reportsId.ReportTheme; label: string }[]; reportsPage: typeof reportsId.reportsPage } =>
  en(l) ? reportsEn : reportsId;

/** Judul & deskripsi SEO bahasa Inggris per halaman (menandai halaman sebagai sudah diterjemahkan). */
export const englishSeo = {
  home: homeEn.homeSeo,
  profile: profileEn.seo,
  audit: auditEn.seo,
  legal: legalEn.seo,
  partnership: partnershipEn.seo,
  programs: programsEn.seo,
  reports: reportsEn.seo,
};

/** Label antarmuka khusus halaman (di luar kamus umum). */
export const pageLabels = (l: Locale) =>
  en(l)
    ? {
        pillarEyebrow: pillarsEn.labels.eyebrow,
        viewPdf: auditEn.labels.viewPdf,
        auditFrame: auditEn.labels.iframeTitle,
        newTab: "new tab",
        partnersAria: partnershipEn.labels.partnersAria,
        partnershipStories: partnershipEn.labels.storiesAria,
        impactStories: "Stories of impact",
        allReports: reportsEn.labels.all,
        reportFilter: reportsEn.labels.filterAria,
        reportsShown: reportsEn.labels.shown,
        readReport: reportsEn.labels.read,
        featuredCampaigns: "Featured campaigns",
        latestPublications: "Latest publications",
      }
    : {
        pillarEyebrow: "Pilar Program",
        viewPdf: "Lihat PDF",
        auditFrame: (title: string) => `Laporan audit keuangan ${title}`,
        newTab: "tab baru",
        partnersAria: "Mitra Relawan Nusantara",
        partnershipStories: "Cerita berdampak kemitraan",
        impactStories: "Cerita berdampak",
        allReports: "Semua",
        reportFilter: "Filter tema laporan",
        reportsShown: (n: number) => `${n} laporan ditampilkan`,
        readReport: "Baca Laporan",
        featuredCampaigns: "Kampanye pilihan",
        latestPublications: "Publikasi terbaru",
      };
