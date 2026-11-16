/**
 * Pindahkan halaman hasil rekonstruksi (Profil, Audit, Legalitas, 4 Pilar, Program Kami +
 * Kerelawanan/Kebencanaan, Kemitraan, e-Report) dari konten di kode (src/content/*.ts dan
 * src/content/en/*.ts) ke data section di kolom `pages.sections` (prompt B7).
 *
 *   npm run db:seed:sections            → tulis ke database (halaman yang SUDAH berbasis section dilewati)
 *   npm run db:seed:sections -- --dry   → hanya validasi, tanpa menulis
 *   npm run db:seed:sections -- --force → timpa juga halaman yang sudah berbasis section
 *                                          (MENGHAPUS suntingan admin pada halaman itu)
 *
 * `updated_at` halaman dipertahankan: ini perpindahan penyimpanan, bukan perubahan isi, sehingga
 * tanggal modifikasi di sitemap dan meta tidak berubah.
 */
import { loadEnvConfig } from "@next/env";
import { eq, sql } from "drizzle-orm";

import {
  auditContent,
  englishSeo,
  legalContent,
  pageLabels,
  partnershipContent,
  pillarsContent,
  profileContent,
  programsContent,
  reportsContent,
} from "@/content/localized";
import type { Pillar } from "@/content/pillars";
import { PILLAR_STORY_COUNT, PILLAR_STORY_MIN } from "@/content/pillars";
import type { Locale } from "@/i18n/config";
import { getDb, schema } from "@/server/db";
import { type PageTemplate, type SectionType, parseSections } from "@/server/sections";

// getDb() membaca DATABASE_URL saat pertama dipanggil (di main), jadi cukup dimuat di sini.
loadEnvConfig(process.cwd());

type Draft = { id: string; type: SectionType; visible: true; data: unknown; en: unknown };
type Build = (locale: Locale) => { type: SectionType; data: unknown }[];

/** Susun section dari pembangun per bahasa: struktur sama, isi `data` = Indonesia, `en` = Inggris. */
function bilingual(build: Build): Draft[] {
  const id = build("id");
  const en = build("en");
  if (id.length !== en.length || id.some((s, i) => s.type !== en[i]?.type)) throw new Error("Struktur section id/en tidak sama");
  return id.map((s, i) => ({ id: `s${i + 1}`, type: s.type, visible: true, data: s.data, en: en[i]?.data }));
}

const pillarSections = (pick: (locale: Locale) => Pillar): Build => (locale) => {
  const p = pick(locale);
  return [
    {
      type: "hero",
      // Judul Indonesia = judul halaman; judul Inggris diisi eksplisit.
      data: { title: locale === "en" ? p.title : "", eyebrow: p.eyebrow ?? pageLabels(locale).pillarEyebrow, image: p.hero, size: "page", overlay: 0.4 },
    },
    { type: "text-tagline", data: { heading: p.tagline, body: p.description } },
    ...(p.stats ? [{ type: "cards-stats" as const, data: { items: p.stats } }] : []),
    { type: "cards-programs", data: { heading: p.programsHeading, items: p.programs } },
    {
      type: "posts",
      data: { heading: "", label: `Cerita berdampak ${p.title}`, categories: p.storyCategories, count: PILLAR_STORY_COUNT, fillMin: PILLAR_STORY_MIN, href: p.storiesHref, showExcerpt: false },
    },
    { type: "cta-banner", data: p.cta },
  ];
};

const PAGES: { path: string; template: PageTemplate; sections: Draft[] }[] = [
  {
    path: "profil-relawan-nusantara",
    template: "sections",
    sections: bilingual((l) => {
      const c = profileContent(l);
      return [
        { type: "hero", data: { title: l === "en" ? englishSeo.profile.title : "", image: c.profileHero.image, size: "medium", overlay: 0.35 } },
        {
          type: "text-embed",
          data: {
            headingLead: c.profileAbout.heading.lead,
            headingStrong: c.profileAbout.heading.strong,
            body: c.profileAbout.body,
            embedSrc: c.profileAbout.embed.src,
            embedTitle: c.profileAbout.embed.title,
          },
        },
        {
          type: "text-vision",
          data: { visionHeading: c.profileVision.heading, visionLines: c.profileVision.lines, missionHeading: c.profileMission.heading, missionItems: c.profileMission.items },
        },
        { type: "cards-links", data: { heading: c.profileTransparency.heading, description: c.profileTransparency.description, items: c.profileTransparency.links } },
      ];
    }),
  },
  {
    path: "audit-keuangan",
    template: "sections",
    sections: bilingual((l) => {
      const c = auditContent(l);
      return [
        { type: "hero", data: { title: l === "en" ? englishSeo.audit.title : "", image: c.auditHero.image, size: "compact", overlay: 0.35 } },
        {
          type: "accordion-docs",
          data: {
            headingLines: c.auditIntro.heading,
            paragraphs: c.auditIntro.paragraphs,
            badge: c.auditIntro.badge,
            items: c.auditReports.map((r) => ({ title: r.title, previewUrl: c.auditPreviewUrl(r), pdfUrl: c.auditPdfUrl(r) })),
          },
        },
      ];
    }),
  },
  {
    path: "asas-legalitas",
    template: "sections",
    sections: bilingual((l) => {
      const c = legalContent(l);
      return [
        { type: "hero", data: { title: l === "en" ? englishSeo.legal.title : "", image: c.legalHero.image, size: "small", overlay: 0.35 } },
        { type: "cards-docs", data: { intro: c.legalIntro, items: c.legalDocs } },
      ];
    }),
  },
  ...(["aksi-kemanusiaan", "lingkungan", "pendidikan", "ekonomi"] as const).map((slug) => ({
    path: slug,
    template: "sections" as const,
    sections: bilingual(pillarSections((l) => pillarsContent(l)[slug])),
  })),
  {
    path: "pr0gram-kami",
    template: "sections",
    sections: bilingual((l) => {
      const c = programsContent(l).programKami;
      return [
        { type: "hero", data: { title: l === "en" ? englishSeo.programs.title : "", image: c.hero, size: "page", overlay: 0.4 } },
        { type: "text-alternating", data: { heading: c.approach.heading, items: c.approach.items } },
        { type: "cards-pillars", data: { headingLines: c.pillars.heading, linkLabel: c.pillars.linkLabel, items: c.pillars.items } },
        {
          type: "posts",
          data: { heading: "", label: pageLabels(l).impactStories, categories: [], count: c.stories.count, fillMin: 0, href: c.stories.href, showExcerpt: false },
        },
        { type: "cta-cards", data: { heading: c.cta.heading, description: c.cta.description, cards: c.cta.cards } },
      ];
    }),
  },
  ...(["kerelawanan", "kebencanaan"] as const).map((key) => ({
    path: `pr0gram-kami/${key}`,
    template: "sections" as const,
    sections: bilingual(pillarSections((l) => programsContent(l).subPrograms[key])),
  })),
  {
    path: "kemitraan",
    // Halaman asli berlatar abu muda (pembungkus bg-surface-alt).
    template: "sections-muted",
    sections: bilingual((l) => {
      const c = partnershipContent(l);
      const L = pageLabels(l);
      const size = c.partnershipSteps.iconSize;
      return [
        { type: "hero", data: { title: l === "en" ? englishSeo.partnership.title : "", image: c.partnershipHero.image, size: "medium", overlay: 0.35 } },
        {
          type: "cards-steps",
          data: {
            heading: c.partnershipSteps.heading,
            items: c.partnershipSteps.items.map((s) => ({ title: s.title, description: s.description, icon: { src: s.icon, width: size, height: size, alt: "" } })),
          },
        },
        { type: "text-list-image", data: { heading: c.partnershipWhy.heading, items: c.partnershipWhy.items, image: c.partnershipWhy.image } },
        // Tanpa butir sendiri → memakai daftar testimoni beranda, sama seperti halaman asli.
        { type: "testimonials", data: { heading: c.partnershipTestimonials.heading, description: c.partnershipTestimonials.description, items: [] } },
        {
          type: "posts",
          data: {
            heading: c.partnershipStories.heading,
            label: L.partnershipStories,
            categories: [c.partnershipStories.category],
            count: c.partnershipStories.count,
            fillMin: 0,
            href: c.partnershipStories.href,
            showExcerpt: true,
          },
        },
        {
          type: "logos",
          data: {
            heading: c.partnershipPartners.heading,
            description: c.partnershipPartners.description,
            label: L.partnersAria,
            // Logo ditampilkan `fill` dalam kotak 150×72; ukuran di sini hanya pengisi skema.
            items: c.partnerLogos.map((logo) => ({ name: logo.name, image: { src: logo.src, width: 150, height: 72, alt: logo.name } })),
          },
        },
        {
          type: "cta-contact",
          data: {
            heading: c.partnershipCta.heading,
            description: c.partnershipCta.description,
            buttonLabel: c.partnershipCta.buttonLabel,
            phoneLabel: c.partnershipCta.phone.label,
            phoneDisplay: c.partnershipCta.phone.display,
            phoneHref: c.partnershipCta.phone.href,
            emailLabel: c.partnershipCta.email.label,
            emailDisplay: c.partnershipCta.email.display,
            emailHref: c.partnershipCta.email.href,
            mapSrc: c.partnershipCta.map.src,
            mapTitle: c.partnershipCta.map.title,
          },
        },
      ];
    }),
  },
  {
    path: "e-report",
    template: "sections",
    sections: bilingual((l) => {
      const c = reportsContent(l);
      return [
        {
          type: "hero",
          data: { title: l === "en" ? englishSeo.reports.title : "", subtitle: c.reportsPage.description, image: c.reportsPage.hero, size: "small", overlay: 0.5 },
        },
        { type: "reports", data: { themes: c.reportThemes.map((t) => ({ slug: t.slug, label: t.label })), items: c.reports } },
      ];
    }),
  },
];

async function main() {
  const dry = process.argv.includes("--dry");
  const force = process.argv.includes("--force");
  const db = getDb();
  let failed = false;

  for (const page of PAGES) {
    const { sections, issues } = parseSections(page.sections);
    if (issues.length || sections.length !== page.sections.length) {
      failed = true;
      console.error(`✗ ${page.path}: data section tidak sah`);
      for (const i of issues) console.error(`    #${i.index + 1} ${i.type} [${i.locale}] ${i.path}: ${i.message}`);
      continue;
    }
    const [row] = await db.select({ id: schema.pages.id, template: schema.pages.template }).from(schema.pages).where(eq(schema.pages.path, page.path)).limit(1);
    if (!row) {
      failed = true;
      console.error(`✗ ${page.path}: halaman tidak ada di database (jalankan npm run db:seed dulu)`);
      continue;
    }
    const summary = `${sections.length} section (${sections.map((s) => s.type).join(", ")})`;
    if (row.template !== "generic" && !force) {
      console.log(`– ${page.path}: sudah berbasis section, dilewati (pakai --force untuk menimpa)`);
      continue;
    }
    if (dry) {
      console.log(`✓ ${page.path}: sah — ${summary}`);
      continue;
    }
    await db
      .update(schema.pages)
      .set({ template: page.template, sections, updatedAt: sql`${schema.pages.updatedAt}` })
      .where(eq(schema.pages.id, row.id));
    console.log(`✓ ${page.path}: ditulis — ${summary}`);
  }
  if (failed) process.exit(1);
  if (!dry) console.log("\nSelesai. Cache halaman disegarkan saat build/deploy berikutnya atau lewat Simpan di /admin/halaman.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
