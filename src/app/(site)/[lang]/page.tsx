import type { Metadata } from "next";

import { site } from "@/config/site";
import { HeroSlider } from "@/components/home/HeroSlider";
import {
  IntroSection,
  PillarsSection,
  PublicationsSection,
  ReportCtaSection,
  TestimonialsSection,
} from "@/components/home/HomeSections";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/config/site";
import { ChosenFront, chosenFrontMetadata } from "@/components/site/ChosenFront";
import { englishSeo } from "@/content/localized";
import { initLocale } from "@/i18n/request";
import { isHomePreview } from "@/lib/home";
import { languageAlternates } from "@/lib/seo";
import { BUILTIN_FRONT_PAGE } from "@/lib/site-settings-schema";
import { getFrontPagePath, getSiteSettings } from "@/server/site-settings";

type LangProps = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Beranda dirender ulang paling lama tiap 10 menit agar jadwal tayang slide (mulai/selesai,
 * diatur di /admin/beranda) berlaku tanpa menunggu ada yang menekan "Terbitkan Perubahan".
 */
export const revalidate = 600;

// Perbaikan SEO (disetujui 13 Nov 2026): title "New Beranda" & description
// "ScrollUntukEksplorasi" diganti; halaman kini punya satu H1.
const SEO = {
  id: {
    description:
      "Relawan Nusantara adalah lembaga kemanusiaan yang menjadi jembatan kebaikan melalui aksi kemanusiaan, pendidikan, ekonomi, dan lingkungan di Indonesia dan dunia.",
  },
  en: englishSeo.home,
};

export async function generateMetadata({ params }: LangProps): Promise<Metadata> {
  const locale = await initLocale(params);
  const front = await getFrontPagePath();
  if (front !== BUILTIN_FRONT_PAGE) return chosenFrontMetadata(front);
  const { identity } = await getSiteSettings();
  const title = locale === "en" ? SEO.en.title : identity.documentTitle;
  // Judul tab dari pengaturan; deskripsi meta tetap teks SEO panjang (tagline terlalu pendek untuk meta).
  const description = locale === "en" ? SEO.en.description : SEO.id.description;
  const url = locale === "en" ? "/en/" : "/";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates("/") },
    openGraph: { title, description, url, type: "website", siteName: site.name, locale: locale === "en" ? "en_US" : site.locale },
  };
}

export default async function HomePage({ params, searchParams }: LangProps) {
  const locale = await initLocale(params);
  const front = await getFrontPagePath();
  if (front !== BUILTIN_FRONT_PAGE) return <ChosenFront path={front} query={await searchParams} />;
  const { identity } = await getSiteSettings();
  const title = locale === "en" ? SEO.en.title : identity.documentTitle;
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      <HeroSlider />
      <IntroSection />
      <PillarsSection />
      <PublicationsSection />
      <TestimonialsSection />
      <ReportCtaSection />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/?s={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {(await isHomePreview()) ? <PreviewBanner /> : null}
    </>
  );
}
